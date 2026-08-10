import { getErrorMessage } from '../utils/errors';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextSuggestions, getWordAtCursor } from '../hooks/useTextSuggestions';
import { estimateConsultations } from '../utils/estimateStats';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RatingModal from '../components/RatingModal';
import ConfirmEndChatModal from '../components/ConfirmEndChatModal';
import { KundliContent } from '../components/KundliPanel';
import { MatchContent } from '../components/MatchPanel';
import PreChatQuestionsModal, { type PreChatAnswers } from '../components/PreChatQuestionsModal';
import CityAutocomplete from '../components/CityAutocomplete';
import { Send, Clock, User, ArrowLeft, Info, X, AlertTriangle, Mic, MicOff, PhoneOff, Megaphone, Lightbulb, HeartHandshake, Orbit } from 'lucide-react';
import type { Astrologer, SeekerProfile, ChartData, MatchData, RazorpayResponse, RazorpayError } from '../types';
import { api } from '../services/api';
import { resolveImageUrl, getAstrologerDisplayName } from '../utils/url';
import { loadRazorpay } from '../utils/loadRazorpay';

export const Chat: React.FC = () => {
    const { consultationId, astrologerId } = useParams<{ consultationId: string; astrologerId: string }>();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // State
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [activeConsultationId, setActiveConsultationId] = useState<string | undefined>(consultationId);
    const [astrologer, setAstrologer] = useState<Astrologer | null>(null);
    const [seeker, setSeeker] = useState<SeekerProfile | null>(null);
    const [isEditingSeeker, setIsEditingSeeker] = useState(false);
    const [editSeekerData, setEditSeekerData] = useState({ date_of_birth: '', time_of_birth: '', place_of_birth: '', gender: '' });

    const handleEditSeekerToggle = () => {
        if (!isEditingSeeker) {
            setEditSeekerData({
                date_of_birth: seeker?.date_of_birth || '',
                time_of_birth: seeker?.time_of_birth || '',
                place_of_birth: seeker?.place_of_birth || '',
                gender: seeker?.gender || ''
            });
        }
        setIsEditingSeeker(!isEditingSeeker);
    };

    const handleSaveSeekerDetails = async () => {
        if (!seeker?.user_id) return;
        try {
            const updated = await api.seekers.updateOne(seeker.user_id, editSeekerData);
            setSeeker(updated);
            setIsEditingSeeker(false);
            if (showKundli) {
                // Fetch the newly generated kundli with updated details.
                // Call handleViewKundli explicitly with updated data.
                handleViewKundli(updated);
            } else {
                setKundliData(null);
            }
            if (showCompatibility) {
                setMatchData(null);
                handleViewCompatibility(updated);
            } else {
                setMatchData(null);
            }
        } catch (e) {
            console.error("Failed to update seeker details", e);
        }
    };
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [showKundli, setShowKundli] = useState(false);
    const [kundliData, setKundliData] = useState<ChartData | null>(null);
    const [kundliLoading, setKundliLoading] = useState(false);
    const [kundliError, setKundliError] = useState<string | null>(null);
    const [showAdhocKundliForm, setShowAdhocKundliForm] = useState(false);
    const [adhocKundliData, setAdhocKundliData] = useState({ full_name: '', date_of_birth: '', time_of_birth: '', place_of_birth: '' });
    const [saveAdhocToProfile, setSaveAdhocToProfile] = useState(false);
    const [showCompatibility, setShowCompatibility] = useState(false);
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const [matchLoading, setMatchLoading] = useState(false);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [showSidebarMobile, setShowSidebarMobile] = useState(false);
    const [showPreChatModal, setShowPreChatModal] = useState(false);
    const [creatingConsultation, setCreatingConsultation] = useState(false);
    const [consultationTopic, setConsultationTopic] = useState<string | null>(null);
    // Whatever spouse/partner info the seeker entered — may be partial (e.g. name
    // only, or missing time of birth). null means nothing was entered at all.
    const [spouseRaw, setSpouseRaw] = useState<{ name: string; date_of_birth: string; time_of_birth: string; place_of_birth: string } | null>(null);
    const [showAdhocSpouseForm, setShowAdhocSpouseForm] = useState(false);
    const [adhocSpouseData, setAdhocSpouseData] = useState({ full_name: '', date_of_birth: '', time_of_birth: '', place_of_birth: '' });
    const [isPromotionalChat, setIsPromotionalChat] = useState(false);
    const [promotionalRateTotal, setPromotionalRateTotal] = useState<number | null>(null);

    // Chat language toggle (both roles): when 'hi', the other party's messages are shown translated
    const [chatLanguage, setChatLanguage] = useState<'en' | 'hi'>('en');
    const [translatedText, setTranslatedText] = useState<Record<number, string>>({});
    const translatingIds = useRef<Set<number>>(new Set());

    // Track visual viewport for mobile keyboard handling
    useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                setViewportHeight(window.visualViewport.height);
            } else {
                setViewportHeight(window.innerHeight);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
        window.addEventListener('resize', handleResize);

        // Lock document scroll
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
            window.removeEventListener('resize', handleResize);

            // Restore document scroll
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const createNewConsultation = async (answers?: PreChatAnswers) => {
        if (!astrologerId) return;
        try {
            setCreatingConsultation(true);
            const data = await api.consultations.create({
                astrologer_id: parseInt(astrologerId),
                consultation_type: 'CHAT',
                ...(answers || {})
            });
            setShowPreChatModal(false);
            navigate(`/chat/${data.id}`, { replace: true });
        } catch (error) {
            console.error("Error creating consultation:", error);
            const message = getErrorMessage(error) || "Failed to start chat session. Please try again.";
            alert(message);
            setShowPreChatModal(false);
            if (message.toLowerCase().includes('insufficient balance')) {
                navigate('/dashboard?recharge=1');
            } else {
                navigate('/dashboard');
            }
        } finally {
            setCreatingConsultation(false);
        }
    };

    // Initialize consultation or set active ID
    useEffect(() => {
        if (astrologerId && !consultationId && token && user) {
            // Seekers answer a short pre-chat questionnaire before the consultation is created.
            if (user.role === 'SEEKER') {
                setShowPreChatModal(true);
                return;
            }
            createNewConsultation();
        } else if (consultationId) {
            setActiveConsultationId(consultationId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [astrologerId, consultationId, token, user, navigate]);

    // Fetch Profile Data (Astrologer OR Seeker)
    useEffect(() => {
        if (!activeConsultationId || !token || !user) return;

        const fetchProfile = async () => {
            try {
                // 1. Get Consultation Details
                const consultData = await api.consultations.getOne(activeConsultationId);
                setConsultationTopic(consultData.topic || null);
                const hasAnySpouseInfo = !!(consultData.spouse_name || consultData.spouse_date_of_birth || consultData.spouse_time_of_birth || consultData.spouse_place_of_birth);
                setSpouseRaw(
                    hasAnySpouseInfo
                        ? {
                            name: consultData.spouse_name || '',
                            date_of_birth: consultData.spouse_date_of_birth || '',
                            time_of_birth: consultData.spouse_time_of_birth || '',
                            place_of_birth: consultData.spouse_place_of_birth || '',
                        }
                        : null
                );
                setIsPromotionalChat(!!consultData.is_promotional_first_chat);
                setPromotionalRateTotal(consultData.promotional_rate_total ?? null);

                // If I am a SEEKER, I want to see the ASTROLOGER
                if (user.role === 'SEEKER') {
                    const astroId = consultData.astrologer_id;
                    const astroData = await api.astrologers.getOne(astroId);
                    setAstrologer({
                        id: astroData.user_id,
                        full_name: astroData.full_name,
                        display_name: astroData.display_name,
                        total_consultations: astroData.total_consultations,
                        profile_picture_url: astroData.profile_picture_url,
                        specialties: astroData.specialties,
                        languages: astroData.languages,
                        experience_years: astroData.experience_years,
                        consultation_fee_per_min: astroData.consultation_fee_per_min,
                        rating_avg: astroData.rating_avg,
                        is_online: astroData.is_online,
                        about_me: astroData.about_me
                    });
                }
                // If I am an ASTROLOGER, I want to see the SEEKER
                else if (user.role === 'ASTROLOGER') {
                    const seekerUserId = consultData.seeker_id;
                    const seekerData = await api.seekers.getOne(seekerUserId);
                    setSeeker(seekerData);
                }

            } catch (err) {
                console.error("Failed to load profile data", err);
            }
        };

        fetchProfile();
    }, [activeConsultationId, token, user]);


    const { messages, sendMessage, sendTyping, endChat, resumeChat, status, pauseReason, billingInfo, timerActive, lowBalance, isTyping, moderationAlert, dismissModerationAlert, sessionError, endedReason, resumeError } = useChat(activeConsultationId || '');

    // Groq-generated coaching hint for the astrologer: refreshed whenever the seeker sends a new message.
    const [coachHint, setCoachHint] = useState<string | null>(null);
    const lastHintedMsgId = useRef<number | undefined>(undefined);
    useEffect(() => {
        if (user?.role !== 'ASTROLOGER' || !activeConsultationId || messages.length === 0) return;
        const last = messages[messages.length - 1];
        if (last.sender_id === user.id || last.id === undefined || last.id === lastHintedMsgId.current) return;
        lastHintedMsgId.current = last.id;
        api.chatHints.getHint(activeConsultationId)
            .then((res: { hint: string | null }) => setCoachHint(res.hint || null))
            .catch(() => { /* hints are best-effort; stay silent on failure */ });
    }, [messages, user, activeConsultationId]);

    // Translate the other party's messages into Hindi when that toggle is on
    useEffect(() => {
        if (chatLanguage !== 'hi' || !activeConsultationId) return;
        messages.forEach(m => {
            if (m.id === undefined || m.sender_id === user?.id) return;
            if (translatedText[m.id] !== undefined || translatingIds.current.has(m.id)) return;
            translatingIds.current.add(m.id);
            api.chatTranslate.translate(activeConsultationId, m.content, 'hi')
                .then(res => setTranslatedText(prev => ({ ...prev, [m.id as number]: res.translated_text })))
                .catch(() => { /* keep showing the original text if translation fails */ })
                .finally(() => translatingIds.current.delete(m.id as number));
        });
    }, [chatLanguage, messages, user, activeConsultationId, translatedText]);

    // React to the chat ending regardless of who ended it (self, other party, or
    // system auto-end) so both sides get feedback and are routed off the page.
    const endHandledRef = useRef(false);
    useEffect(() => {
        if (status !== 'ENDED' || endHandledRef.current) return;
        endHandledRef.current = true;
        if (user?.role === 'SEEKER') {
            setShowRatingModal(true);
        } else if (user?.role === 'ASTROLOGER') {
            const t = setTimeout(() => navigate('/dashboard'), 2500);
            return () => clearTimeout(t);
        }
    }, [status, user?.role, navigate]);

    // Queue position for a waiting seeker (Q2): poll until the astrologer engages.
    const [queueAhead, setQueueAhead] = useState<number | null>(null);
    useEffect(() => {
        if (user?.role !== 'SEEKER' || !activeConsultationId) return;
        if (timerActive || status === 'ACTIVE' || status === 'ENDED') { setQueueAhead(null); return; }
        let cancelled = false;
        const poll = () => {
            api.consultations.queuePosition(activeConsultationId)
                .then((r: { ahead: number; status: string }) => {
                    if (!cancelled) setQueueAhead(r.status === 'REQUESTED' ? r.ahead : null);
                })
                .catch(() => { /* ignore */ });
        };
        poll();
        const t = setInterval(poll, 8000);
        return () => { cancelled = true; clearInterval(t); };
    }, [user?.role, activeConsultationId, timerActive, status]);

    const [rechargeAmount, setRechargeAmount] = useState('');
    const [isRecharging, setIsRecharging] = useState(false);

    const handleInChatRecharge = async () => {
        const amt = Number(rechargeAmount);
        if (!rechargeAmount || isNaN(amt) || amt <= 0) return;
        try {
            setIsRecharging(true);
            const loaded = await loadRazorpay();
            if (!loaded) {
                alert('Failed to load Razorpay SDK. Please try again.');
                setIsRecharging(false);
                return;
            }
            const orderData = await api.payment.createOrder(amt);
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'AadiKarta',
                description: 'Wallet Recharge',
                order_id: orderData.order_id,
                handler: async (response: RazorpayResponse) => {
                    try {
                        await api.payment.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        setRechargeAmount('');
                        resumeChat();
                    } catch {
                        alert('Payment verification failed. Please try again.');
                    }
                },
                theme: { color: '#E91E63' }
            };
            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (r: RazorpayError) => {
                api.payment.reportFailure({
                    razorpay_order_id: orderData.order_id,
                    code: r.error.code,
                    description: r.error.description,
                    reason: r.error.reason,
                    source: "chat"
                });
                alert("Payment failed: " + r.error.description);
            });
            rzp.open();
        } catch (e) {
            alert('Failed to initiate payment: ' + (getErrorMessage(e) || 'Unknown error'));
        } finally {
            setIsRecharging(false);
        }
    };

    // Get opponent info (Astrologer if Seeker, Seeker if Astrologer)
    const opponent = user?.role === 'SEEKER' ? astrologer : (seeker ? {
        full_name: seeker.full_name || 'Client',
        profile_picture_url: null, // Seekers don't have profile pics in schema?
    } : null);
    // Seekers only ever see the astrologer's public nickname, never their legal full_name
    const opponentName = user?.role === 'SEEKER'
        ? getAstrologerDisplayName(astrologer)
        : (opponent?.full_name || 'User');

    useEffect(() => {
        // Double scroll to ensure layout has settled
        scrollToBottom();
        const timer = setTimeout(scrollToBottom, 50);
        return () => clearTimeout(timer);
    }, [messages]);

    const sendCurrentInput = () => {
        // Guard against sending while the consultation is paused/ended — the
        // composer is only visually covered by an overlay in those states, so
        // a textarea that had focus before the overlay appeared could otherwise
        // still submit (e.g. right after the seeker disconnects).
        if (input.trim() && status !== 'PAUSED' && status !== 'ENDED') {
            sendMessage(input);
            setInput('');
            setSuggestions([]);
            setSuggestionTarget(null);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        sendCurrentInput();
    };

    const lastTyped = useRef(0);
    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    const { getSuggestions } = useTextSuggestions();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [suggestionTarget, setSuggestionTarget] = useState<{ start: number; end: number } | null>(null);

    const computeSuggestions = (value: string, cursor: number) => {
        const atCursor = getWordAtCursor(value, cursor);
        if (atCursor.word.length >= 2) {
            setSuggestions(getSuggestions(atCursor.word, false));
            setSuggestionTarget({ start: atCursor.start, end: atCursor.end });
            return;
        }
        // Cursor sits right after a just-finished word (e.g. a space was typed) — spell-check it.
        let pos = cursor;
        while (pos > 0 && /[^a-zA-Z']/.test(value[pos - 1])) pos--;
        if (pos > 0) {
            const prev = getWordAtCursor(value, pos);
            if (prev.word.length >= 2) {
                const corrections = getSuggestions(prev.word, true);
                setSuggestions(corrections);
                setSuggestionTarget(corrections.length ? { start: prev.start, end: prev.end } : null);
                return;
            }
        }
        setSuggestions([]);
        setSuggestionTarget(null);
    };

    // getSuggestions does a dictionary scan / edit-distance spell-check that's too
    // expensive to run synchronously on every keystroke — it was blocking the
    // textarea from repainting immediately, making typing (especially backspace)
    // feel delayed. Debounce it so the textbox updates instantly and suggestions
    // catch up shortly after the user pauses.
    const suggestionsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Tracks whether the change in progress is a deletion, so onSelect (which
    // fires right after onChange on the same backspace keystroke) can skip
    // re-triggering suggestions too — otherwise both handlers keep resetting the
    // debounce timer into the heavy spell-check path for every character deleted.
    const isDeletingRef = useRef(false);
    const updateSuggestions = (value: string, cursor: number) => {
        if (suggestionsTimeoutRef.current) clearTimeout(suggestionsTimeoutRef.current);
        suggestionsTimeoutRef.current = setTimeout(() => computeSuggestions(value, cursor), 150);
    };
    useEffect(() => {
        return () => {
            if (suggestionsTimeoutRef.current) clearTimeout(suggestionsTimeoutRef.current);
        };
    }, []);

    const prevInputLenRef = useRef(0);
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const isDeleting = value.length < prevInputLenRef.current;
        prevInputLenRef.current = value.length;
        isDeletingRef.current = isDeleting;
        setInput(value);
        if (isDeleting) {
            // Deleting text shouldn't run the suggestion engine at all — its
            // heaviest path (edit-distance spell-check, triggered as soon as the
            // cursor lands right after a finished word) was making backspacing
            // feel laggy. Just clear suggestions instantly instead.
            if (suggestionsTimeoutRef.current) clearTimeout(suggestionsTimeoutRef.current);
            setSuggestions([]);
            setSuggestionTarget(null);
        } else {
            updateSuggestions(value, e.target.selectionStart ?? value.length);
        }
        const now = Date.now();
        if (now - lastTyped.current > 2000) {
            sendTyping();
            lastTyped.current = now;
        }
    };

    const applySuggestion = (word: string) => {
        if (!suggestionTarget) return;
        const { start, end } = suggestionTarget;
        const before = input.slice(0, start);
        const after = input.slice(end);
        const insertion = after.startsWith(' ') ? word : `${word} `;
        const newValue = before + insertion + after;
        setInput(newValue);
        setSuggestions([]);
        setSuggestionTarget(null);
        requestAnimationFrame(() => {
            const pos = before.length + insertion.length;
            messageInputRef.current?.setSelectionRange(pos, pos);
            messageInputRef.current?.focus();
        });
    };

    // Astrologer voice input: speak in Hindi, get the recognized text appended to the composer.
    const speech = useSpeechToText();
    // Text already in the composer when the current listening session started —
    // interim (not-yet-final) results are rendered live on top of this so the
    // textbox updates as the astrologer speaks instead of waiting several
    // seconds for the engine to mark a phrase "final".
    const voiceBaseRef = useRef('');
    const toggleVoiceInput = () => {
        if (speech.isListening) {
            speech.stop();
            return;
        }
        voiceBaseRef.current = input;
        speech.start((chunk) => {
            voiceBaseRef.current = voiceBaseRef.current
                ? `${voiceBaseRef.current.trim()} ${chunk}`
                : chunk;
            setInput(voiceBaseRef.current);
        });
    };
    useEffect(() => {
        if (!speech.isListening || !speech.interimText) return;
        setInput(voiceBaseRef.current
            ? `${voiceBaseRef.current.trim()} ${speech.interimText}`
            : speech.interimText);
    }, [speech.interimText, speech.isListening]);

    const clearInput = () => {
        if (suggestionsTimeoutRef.current) clearTimeout(suggestionsTimeoutRef.current);
        setInput('');
        setSuggestions([]);
        setSuggestionTarget(null);
        // Stop an in-progress voice dictation too — otherwise its next interim
        // result would immediately repopulate the composer from voiceBaseRef,
        // making the clear appear to silently undo itself.
        if (speech.isListening) speech.stop();
        voiceBaseRef.current = '';
        messageInputRef.current?.focus();
    };

    const handleEndChat = () => {
        setShowEndChatConfirm(true);
    };

    const confirmEndChat = () => {
        setShowEndChatConfirm(false);
        endChat();
        // Side effects (rating modal / redirect) are handled by the status-watching
        // effect above so they fire the same way whether I ended the chat or the
        // other party did.
    };

    const handleShareKundliImage = async (blob: Blob, caption?: string) => {
        if (!activeConsultationId) return;
        await api.chatImage.shareImage(activeConsultationId, blob, caption);
        setShowSidebarMobile(false);
    };

    const handleSubmitReview = async (rating: number, comment: string) => {
        if (!activeConsultationId) return;
        try {
            await api.consultations.submitReview(parseInt(activeConsultationId), rating, comment);
        } catch (err) {
            console.error('Failed to submit review', err);
        }
        setShowRatingModal(false);
        navigate('/dashboard');
    };

    const handleSkipReview = () => {
        setShowRatingModal(false);
        navigate('/dashboard');
    };

    const handleViewKundli = async (seekerOverride?: SeekerProfile) => {
        const targetSeeker = seekerOverride || seeker;
        if (!targetSeeker) return;

        // Use cached data only if we aren't overriding (re-fetching on edit)
        if (kundliData && !seekerOverride) {
            setShowKundli(true);
            return;
        }

        // Profile is missing birth details — offer the ad-hoc entry form
        // instead of calling the API with blank fields.
        if (!(targetSeeker.date_of_birth && targetSeeker.time_of_birth && targetSeeker.place_of_birth)) {
            setShowKundli(true);
            setShowAdhocKundliForm(true);
            setAdhocKundliData({
                full_name: targetSeeker.full_name || '',
                date_of_birth: targetSeeker.date_of_birth || '',
                time_of_birth: targetSeeker.time_of_birth || '',
                place_of_birth: targetSeeker.place_of_birth || '',
            });
            return;
        }

        setShowKundli(true);
        setKundliLoading(true);
        setKundliError(null);

        try {
            const data = await api.kundli.generate({
                seeker_id: targetSeeker.user_id,
                full_name: targetSeeker.full_name || 'Seeker',
                date_of_birth: targetSeeker.date_of_birth || '',
                time_of_birth: targetSeeker.time_of_birth || '',
                place_of_birth: targetSeeker.place_of_birth || '',
            });
            setKundliData(data.chart_data);
        } catch (err) {
            setKundliError(getErrorMessage(err) || 'Failed to generate Kundli. Please try again.');
        } finally {
            setKundliLoading(false);
        }
    };

    const generateCompatibility = async (
        person: SeekerProfile,
        spouse: { full_name: string; date_of_birth: string; time_of_birth: string; place_of_birth: string }
    ) => {
        setMatchLoading(true);
        setMatchError(null);
        try {
            const seekerPerson = {
                seeker_id: person.user_id,
                full_name: person.full_name || 'Seeker',
                date_of_birth: person.date_of_birth || '',
                time_of_birth: person.time_of_birth || '',
                place_of_birth: person.place_of_birth || '',
            };
            // Guna Milan roles are just labels for the two charts being compared —
            // put the seeker on whichever side matches their recorded gender.
            const seekerIsBride = person.gender === 'FEMALE';
            const data = await api.matching.generate({
                boy: seekerIsBride ? spouse : seekerPerson,
                girl: seekerIsBride ? seekerPerson : spouse,
            });
            setMatchData(data.match_data);
        } catch (err) {
            setMatchError(getErrorMessage(err) || 'Failed to generate compatibility report. Please try again.');
        } finally {
            setMatchLoading(false);
        }
    };

    const handleViewCompatibility = async (targetSeeker?: SeekerProfile) => {
        const person = targetSeeker || seeker;
        setShowCompatibility(true);
        setShowKundli(false);
        if (!person || !spouseRaw) return;

        // Cached from a previous view — no need to regenerate, unless we're
        // re-fetching with updated seeker details.
        if (matchData && !targetSeeker) return;

        // Spouse info is missing a field (e.g. no time of birth) — offer the
        // ad-hoc entry form instead of calling the API with blank fields.
        if (!(spouseRaw.date_of_birth && spouseRaw.time_of_birth && spouseRaw.place_of_birth)) {
            setShowAdhocSpouseForm(true);
            setAdhocSpouseData({
                full_name: spouseRaw.name || '',
                date_of_birth: spouseRaw.date_of_birth || '',
                time_of_birth: spouseRaw.time_of_birth || '',
                place_of_birth: spouseRaw.place_of_birth || '',
            });
            return;
        }

        await generateCompatibility(person, {
            full_name: spouseRaw.name || 'Spouse',
            date_of_birth: spouseRaw.date_of_birth,
            time_of_birth: spouseRaw.time_of_birth,
            place_of_birth: spouseRaw.place_of_birth,
        });
    };

    // Generates a compatibility report from spouse/partner birth details the
    // astrologer typed in manually, filling in whatever the seeker left out.
    const handleGenerateAdhocCompatibility = async () => {
        if (!seeker) return;
        const { full_name, date_of_birth, time_of_birth, place_of_birth } = adhocSpouseData;
        if (!date_of_birth || !time_of_birth || !place_of_birth) return;

        setShowAdhocSpouseForm(false);
        await generateCompatibility(seeker, {
            full_name: full_name || 'Spouse',
            date_of_birth,
            time_of_birth,
            place_of_birth,
        });
    };

    // Generates a Kundli from birth details the astrologer typed in manually
    // (e.g. shared verbally by the seeker in chat). By default this doesn't
    // touch the seeker's saved profile — saveAdhocToProfile opts into also
    // persisting these details via the same endpoint the pencil-icon edit uses.
    const handleGenerateAdhocKundli = async () => {
        if (!seeker?.user_id) return;
        const { full_name, date_of_birth, time_of_birth, place_of_birth } = adhocKundliData;
        if (!date_of_birth || !time_of_birth || !place_of_birth) return;

        setShowAdhocKundliForm(false);
        setKundliLoading(true);
        setKundliError(null);

        try {
            if (saveAdhocToProfile) {
                const updated = await api.seekers.updateOne(seeker.user_id, {
                    full_name,
                    date_of_birth,
                    time_of_birth,
                    place_of_birth,
                });
                setSeeker(updated);
            }
            const data = await api.kundli.generate({
                seeker_id: seeker.user_id,
                full_name: full_name || seeker.full_name || 'Seeker',
                date_of_birth,
                time_of_birth,
                place_of_birth,
            });
            setKundliData(data.chart_data);
        } catch (err) {
            setKundliError(getErrorMessage(err) || 'Failed to generate Kundli. Please try again.');
        } finally {
            setKundliLoading(false);
        }
    };

    if (astrologerId && !consultationId) {
        return (
            <div className="chat-slide-in flex flex-col min-h-screen bg-[#FFF9F0]">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E91E63] mb-4"></div>
                    <p className="text-gray-600 font-medium">Initializing secure chat session...</p>
                </div>
                <Footer />

                {/* Pre-Chat Questions for Seekers starting a new consultation */}
                <PreChatQuestionsModal
                    isOpen={showPreChatModal}
                    onClose={() => { setShowPreChatModal(false); navigate('/dashboard'); }}
                    onSubmit={createNewConsultation}
                    submitting={creatingConsultation}
                />
            </div>
        );
    }

    return (
        <div
            className="chat-slide-in fixed inset-0 flex flex-col overflow-hidden bg-[#FFF9F0]"
            style={{
                height: viewportHeight,
                top: window.visualViewport?.offsetTop || 0
            }}
        >
            <div className="hidden md:block">
                <Header />
            </div>

            <main className="flex-1 container mx-auto p-0 flex flex-col min-h-0">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="hidden md:flex mb-4 items-center gap-2 text-gray-600 hover:text-[#E91E63] transition-colors font-medium w-fit"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="flex-1 flex gap-6 overflow-hidden min-h-0 relative">

                    {/* Left Panel: Details (Astrologer OR Seeker) */}
                    <div className={`
                        ${showSidebarMobile
                            ? 'chat-native-safe-top chat-native-safe-bottom flex fixed inset-0 z-50 bg-white p-6 shadow-2xl animate-in slide-in-from-left duration-300 overflow-y-auto'
                            : 'hidden'
                        }
                        md:relative md:flex md:inset-auto md:z-0 md:bg-white md:p-6 md:m-0 md:w-1/3 md:rounded-2xl md:shadow-lg md:overflow-y-auto md:border md:border-gray-100 flex-col
                    `}>
                        {/* Mobile Close Button */}
                        <div className="md:hidden flex justify-between items-center mb-6">
                            <h2 className="font-bold text-lg text-gray-800">
                                {user?.role === 'SEEKER' ? 'Astrologer Info' : 'Seeker Details'}
                            </h2>
                            <button
                                onClick={() => setShowSidebarMobile(false)}
                                className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        {user?.role === 'SEEKER' ? (
                            // Show ASTROLOGER Profile to Seeker
                            astrologer ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center text-center">
                                        <img
                                            src={resolveImageUrl(astrologer.profile_picture_url, getAstrologerDisplayName(astrologer))}
                                            alt={getAstrologerDisplayName(astrologer)}
                                            className="w-32 h-32 rounded-full object-cover border-4 border-[#FFB700] shadow-md mb-4"
                                        />
                                        <h2 className="text-2xl font-bold text-gray-900">{getAstrologerDisplayName(astrologer)}</h2>
                                        <p className="text-[#E91E63] font-semibold">{astrologer.specialties}</p>

                                        <div className="flex items-center gap-2 mt-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                            <div className={`w-2 h-2 rounded-full ${astrologer.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                            <span className="text-xs font-bold text-green-700 uppercase tracking-wide">{astrologer.is_online ? "Online Now" : "Offline"}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                            <span className="block text-2xl font-bold text-gray-900">{astrologer.rating_avg}</span>
                                            <span className="text-xs text-gray-900 uppercase font-semibold">Rating</span>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                            <span className="block text-2xl font-bold text-gray-900">{astrologer.experience_years}+</span>
                                            <span className="text-xs text-gray-900 uppercase font-semibold">Years Exp.</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About Astrologer</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {astrologer.about_me || "Expert astrologer specializing in Vedic astrology and career guidance. Experienced in providing detailed insights and effective remedies."}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Languages</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(astrologer.languages || '').split(',').map((lang, i) => (
                                                    <span key={i} className="bg-[#FFF9F0] text-gray-700 px-3 py-1 rounded-lg text-xs font-medium border border-orange-100">
                                                        {lang.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Consultation Rate</h3>
                                            <p className="text-gray-900 font-bold text-lg">₹{astrologer.consultation_fee_per_min}<span className="text-sm text-gray-900 font-normal">/min</span></p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E91E63] mb-2"></div>
                                    <p>Loading Profile...</p>
                                </div>
                            )
                        ) : (
                            // Show SEEKER Details to Astrologer
                            seeker ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-[#FFB700] shadow-md mb-4 text-blue-600">
                                            <User size={64} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">{seeker.full_name || "Seeker"}</h2>
                                        <span className="text-sm text-gray-900 font-medium">Client Details</span>
                                    </div>

                                    {/* Toggle: Profile <-> Kundli <-> Compatibility (kept in the same panel so content never disappears once loaded) */}
                                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                                        <button
                                            onClick={() => { setShowKundli(false); setShowCompatibility(false); }}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${!showKundli && !showCompatibility ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-900 hover:text-gray-700'}`}
                                        >
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => handleViewKundli()}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${showKundli ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-900 hover:text-gray-700'}`}
                                        >
                                            🔮 Kundli
                                        </button>
                                        {spouseRaw && (
                                            <button
                                                onClick={() => handleViewCompatibility()}
                                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${showCompatibility ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-900 hover:text-gray-700'}`}
                                            >
                                                <HeartHandshake size={14} /> Match
                                            </button>
                                        )}
                                    </div>

                                    {showCompatibility ? (
                                        <div className="pt-2 border-t border-gray-100">
                                            <div className="flex items-center justify-between px-1 pb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    {showAdhocSpouseForm ? 'Complete Spouse Details' : 'Compatibility'}
                                                </span>
                                            </div>
                                            {!spouseRaw ? (
                                                <p className="text-sm text-gray-500 p-4">No spouse/partner details were provided for this consultation.</p>
                                            ) : !(seeker?.date_of_birth && seeker?.time_of_birth && seeker?.place_of_birth) ? (
                                                <p className="text-sm text-gray-500 p-4">Seeker's birth details are missing. Add them from the Profile tab first.</p>
                                            ) : showAdhocSpouseForm ? (
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                                    <p className="text-xs text-gray-500">
                                                        The seeker didn't provide complete spouse/partner birth details. Fill in what's missing to generate the compatibility report.
                                                    </p>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                                        <input type="text" value={adhocSpouseData.full_name} onChange={e => setAdhocSpouseData({ ...adhocSpouseData, full_name: e.target.value })} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" placeholder="Spouse/partner name" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</label>
                                                        <input type="date" value={adhocSpouseData.date_of_birth} onChange={e => setAdhocSpouseData({ ...adhocSpouseData, date_of_birth: e.target.value })} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Time of Birth</label>
                                                        <input type="time" step="1" value={adhocSpouseData.time_of_birth} onChange={e => setAdhocSpouseData({ ...adhocSpouseData, time_of_birth: e.target.value })} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Place of Birth</label>
                                                        <CityAutocomplete value={adhocSpouseData.place_of_birth} onChange={place_of_birth => setAdhocSpouseData({ ...adhocSpouseData, place_of_birth })} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" placeholder="City, State, Country" />
                                                    </div>
                                                    <button
                                                        onClick={handleGenerateAdhocCompatibility}
                                                        disabled={!adhocSpouseData.date_of_birth || !adhocSpouseData.time_of_birth || !adhocSpouseData.place_of_birth}
                                                        className="w-full bg-[#E91E63] text-white py-2 rounded-lg text-sm font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        Generate Compatibility
                                                    </button>
                                                </div>
                                            ) : (
                                                <MatchContent
                                                    matchData={matchData}
                                                    boyName={seeker?.gender === 'FEMALE' ? (spouseRaw.name || 'Partner') : (seeker?.full_name || 'Seeker')}
                                                    girlName={seeker?.gender === 'FEMALE' ? (seeker?.full_name || 'Seeker') : (spouseRaw.name || 'Partner')}
                                                    loading={matchLoading}
                                                    error={matchError}
                                                    canShare={user?.role === 'ASTROLOGER'}
                                                    onShareImage={handleShareKundliImage}
                                                />
                                            )}
                                        </div>
                                    ) : !showKundli ? (
                                        <div className="space-y-4 pt-4 border-t border-gray-100">

                                            {isEditingSeeker ? (
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</label>
                                                            <input type="date" value={editSeekerData.date_of_birth} onChange={e => setEditSeekerData({...editSeekerData, date_of_birth: e.target.value})} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Time of Birth</label>
                                                            <input type="time" step="1" value={editSeekerData.time_of_birth} onChange={e => setEditSeekerData({...editSeekerData, time_of_birth: e.target.value})} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Place of Birth</label>
                                                            <CityAutocomplete value={editSeekerData.place_of_birth} onChange={place_of_birth => setEditSeekerData({...editSeekerData, place_of_birth})} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" placeholder="City, State, Country" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
                                                            <select value={editSeekerData.gender} onChange={e => setEditSeekerData({...editSeekerData, gender: e.target.value})} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white">
                                                                <option value="">Select</option>
                                                                <option value="MALE">Male</option>
                                                                <option value="FEMALE">Female</option>
                                                                <option value="OTHER">Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex gap-2 pt-2">
                                                            <button onClick={handleSaveSeekerDetails} className="flex-1 bg-[#E91E63] text-white py-2 rounded-lg text-sm font-bold shadow-md">Save</button>
                                                            <button onClick={handleEditSeekerToggle} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-bold">Cancel</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative group">
                                                    <button onClick={handleEditSeekerToggle} className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:text-[#E91E63] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</h3>
                                                            <p className="text-gray-900 font-medium">
                                                                {seeker.date_of_birth ? new Date(seeker.date_of_birth).toLocaleDateString() : 'Not provided'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Time of Birth</h3>
                                                            <p className="text-gray-900 font-medium">
                                                                {seeker.time_of_birth ? seeker.time_of_birth : 'Not provided'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Place of Birth</h3>
                                                            <p className="text-gray-900 font-medium">
                                                                {seeker.place_of_birth || 'Not provided'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</h3>
                                                            <p className="text-gray-900 font-medium">
                                                                {seeker.gender || 'Not specified'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    ) : (
                                        <div className="pt-2 border-t border-gray-100">
                                            <div className="flex items-center justify-between px-1 pb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    {kundliData && !showAdhocKundliForm ? 'Chart' : 'Ad-hoc Kundli'}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setAdhocKundliData({
                                                            full_name: seeker.full_name || '',
                                                            date_of_birth: seeker.date_of_birth || '',
                                                            time_of_birth: seeker.time_of_birth || '',
                                                            place_of_birth: seeker.place_of_birth || '',
                                                        });
                                                        setSaveAdhocToProfile(false);
                                                        setShowAdhocKundliForm(v => !v);
                                                    }}
                                                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                                                >
                                                    {showAdhocKundliForm ? 'Cancel' : '✏️ Enter details manually'}
                                                </button>
                                            </div>

                                            {showAdhocKundliForm ? (
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 space-y-3">
                                                    <p className="text-xs text-gray-500">
                                                        Enter the birth details the seeker shared in chat.
                                                    </p>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                                        <input type="text" value={adhocKundliData.full_name} onChange={e => setAdhocKundliData({ ...adhocKundliData, full_name: e.target.value })} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" placeholder="Full name" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</label>
                                                        <input type="date" value={adhocKundliData.date_of_birth} onChange={e => setAdhocKundliData({ ...adhocKundliData, date_of_birth: e.target.value })} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Time of Birth</label>
                                                        <input type="time" step="1" value={adhocKundliData.time_of_birth} onChange={e => setAdhocKundliData({ ...adhocKundliData, time_of_birth: e.target.value })} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase">Place of Birth</label>
                                                        <CityAutocomplete value={adhocKundliData.place_of_birth} onChange={place_of_birth => setAdhocKundliData({ ...adhocKundliData, place_of_birth })} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white" placeholder="City, State, Country" />
                                                    </div>
                                                    <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={saveAdhocToProfile}
                                                            onChange={e => setSaveAdhocToProfile(e.target.checked)}
                                                            className="mt-0.5"
                                                        />
                                                        <span>Also update the seeker's saved profile with these details</span>
                                                    </label>
                                                    <button
                                                        onClick={handleGenerateAdhocKundli}
                                                        disabled={!adhocKundliData.date_of_birth || !adhocKundliData.time_of_birth || !adhocKundliData.place_of_birth}
                                                        className="w-full bg-[#E91E63] text-white py-2 rounded-lg text-sm font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        Generate Kundli
                                                    </button>
                                                </div>
                                            ) : (
                                                <KundliContent
                                                    chartData={kundliData}
                                                    loading={kundliLoading}
                                                    error={kundliError}
                                                    canShare={user?.role === 'ASTROLOGER'}
                                                    onShareImage={handleShareKundliImage}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E91E63] mb-2"></div>
                                    <p>Loading Client Data...</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Mobile Backdrop */}
                    {showSidebarMobile && (
                        <div
                            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                            onClick={() => setShowSidebarMobile(false)}
                        />
                    )}

                    {/* Right Panel: Chat Interface */}
                    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 relative">
                        {/* Chat Header */}
                        <div className="chat-native-safe-top bg-white p-3 md:p-4 border-b border-gray-100 flex justify-between items-center gap-2 z-10">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {/* Mobile only profile summary */}
                                <div className="md:hidden flex items-center gap-2 min-w-0">
                                    <img src={resolveImageUrl(opponent?.profile_picture_url, opponentName)} className="w-9 h-9 rounded-full border-2 border-[#FFB700] flex-shrink-0" alt="Profile" />
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">{opponent ? opponentName : 'Loading...'}</h3>
                                        <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">● Live</span>
                                    </div>
                                </div>

                                {/* Desktop Header Title */}
                                <div className="hidden md:block">
                                    <h2 className="font-bold text-lg text-gray-800">Chat Session</h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 md:gap-4 flex-shrink-0">
                                {status === 'PAUSED' ? (
                                    <div className="flex items-center gap-1 md:gap-2 text-orange-700 bg-orange-50 px-2 md:px-3 py-1 rounded-full border border-orange-200 text-xs md:text-sm font-medium animate-pulse">
                                        <Clock size={14} className="md:hidden" />
                                        <Clock size={16} className="hidden md:block" />
                                        <span className="font-mono">Paused</span>
                                    </div>
                                ) : timerActive ? (
                                    <div className="flex items-center gap-1 md:gap-2 text-green-700 bg-green-50 px-2 md:px-3 py-1 rounded-full border border-green-200 text-xs md:text-sm font-medium">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                                        <span className="font-mono">Active</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 md:gap-2 text-yellow-700 bg-yellow-50 px-2 md:px-3 py-1 rounded-full border border-yellow-200 text-xs md:text-sm font-medium">
                                        <Clock size={14} className="md:hidden" />
                                        <Clock size={16} className="hidden md:block" />
                                        <span className="font-mono">Waiting</span>
                                    </div>
                                )}

                                {isPromotionalChat && (
                                    <div
                                        className="hidden sm:flex items-center gap-1.5 text-[#E91E63] bg-pink-50 px-3 py-1 rounded-full border border-pink-200 text-xs font-bold"
                                        title={promotionalRateTotal ? `₹${promotionalRateTotal} for the first 5 minutes` : undefined}
                                    >
                                        Promotional Call
                                    </div>
                                )}

                                {(user?.role === 'SEEKER' || user?.role === 'ASTROLOGER') && status !== 'ENDED' && (
                                    <div className={`text-sm hidden sm:flex items-center gap-3 ${lowBalance ? 'text-amber-700' : 'text-gray-600'}`}>
                                        <span>Time Remaining: <span className={`font-bold font-mono ${lowBalance ? 'text-amber-700' : 'text-gray-900'}`}>{billingInfo.minutes_remaining} min</span></span>
                                    </div>
                                )}

                                <div className="hidden sm:flex items-center bg-gray-100 rounded-full p-0.5 text-xs font-bold flex-shrink-0" title="Translate the other person's messages">
                                    <button
                                        onClick={() => setChatLanguage('en')}
                                        className={`px-3 py-1 rounded-full transition-colors ${chatLanguage === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-900 hover:text-gray-700'}`}
                                    >
                                        EN
                                    </button>
                                    <button
                                        onClick={() => setChatLanguage('hi')}
                                        className={`px-3 py-1 rounded-full transition-colors ${chatLanguage === 'hi' ? 'bg-white text-[#E91E63] shadow-sm' : 'text-gray-900 hover:text-gray-700'}`}
                                    >
                                        हिं
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowSidebarMobile(true)}
                                    className="md:hidden p-2 text-gray-900 hover:text-[#E91E63] bg-gray-50 rounded-full border border-gray-200 transition-colors flex-shrink-0"
                                    aria-label="View Kundli & Profile Info"
                                >
                                    <Orbit size={18} />
                                </button>

                                {user?.role === 'SEEKER' && (
                                    <button
                                        onClick={handleEndChat}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-full transition-colors border border-red-200 flex-shrink-0"
                                        title="End Chat"
                                        aria-label="End Chat"
                                    >
                                        <PhoneOff size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mobile-only compact bar: billing details + language toggle move here so they
                            never get clipped out of the cramped header row above (they were previously
                            invisible on mobile — either hidden or pushed off-screen with no scroll). */}
                        <div className="md:hidden flex items-center gap-3 px-4 py-1.5 border-b border-gray-100 bg-gray-50 overflow-x-auto text-[11px] flex-shrink-0 whitespace-nowrap">
                            {(user?.role === 'SEEKER' || user?.role === 'ASTROLOGER') && status !== 'ENDED' && (
                                <span className={lowBalance ? 'text-amber-700' : 'text-gray-600'}>
                                    Left: <span className="font-bold font-mono">{billingInfo.minutes_remaining}m</span>
                                </span>
                            )}
                            {isPromotionalChat && (
                                <span className="text-[#E91E63] font-bold">Promo</span>
                            )}
                            <div className="flex items-center bg-gray-200 rounded-full p-0.5 text-[10px] font-bold flex-shrink-0 ml-auto" title="Translate the other person's messages">
                                <button
                                    onClick={() => setChatLanguage('en')}
                                    className={`px-2.5 py-0.5 rounded-full transition-colors ${chatLanguage === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-900'}`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setChatLanguage('hi')}
                                    className={`px-2.5 py-0.5 rounded-full transition-colors ${chatLanguage === 'hi' ? 'bg-white text-[#E91E63] shadow-sm' : 'text-gray-900'}`}
                                >
                                    हिं
                                </button>
                            </div>
                        </div>

                        {/* Low Balance Warning Banner */}
                        {user?.role === 'SEEKER' && lowBalance && status !== 'ENDED' && (
                            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-800 text-sm flex-shrink-0">
                                <AlertTriangle size={15} className="flex-shrink-0 text-amber-500" />
                                <span>
                                    Low balance — <span className="font-bold">{billingInfo.minutes_remaining} min remaining</span>.{' '}
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="font-bold underline hover:text-amber-900"
                                    >
                                        Add funds
                                    </button>
                                </span>
                            </div>
                        )}

                        {/* Low Time Warning Banner (Astrologer view) */}
                        {user?.role === 'ASTROLOGER' && lowBalance && status !== 'ENDED' && (
                            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-800 text-sm flex-shrink-0">
                                <AlertTriangle size={15} className="flex-shrink-0 text-amber-500" />
                                <span>
                                    Seeker's balance is low — <span className="font-bold">{billingInfo.minutes_remaining} min remaining</span>. The chat may pause soon.
                                </span>
                            </div>
                        )}

                        {/* Discussion Topic (Astrologer view) — what the seeker said they want to talk about */}
                        {user?.role === 'ASTROLOGER' && consultationTopic && (
                            <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-start gap-2 text-indigo-800 text-sm flex-shrink-0">
                                <Info size={15} className="flex-shrink-0 text-indigo-500 mt-0.5" />
                                <span className="font-bold">{consultationTopic}</span>
                            </div>
                        )}

                        {/* Moderation Alarm — strong, can't-miss banner (Q6) */}
                        {moderationAlert && (
                            <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-2 text-sm flex-shrink-0 animate-pulse">
                                <AlertTriangle size={18} className="flex-shrink-0" />
                                <span className="flex-1 font-semibold">{moderationAlert}</span>
                                <button onClick={dismissModerationAlert} className="text-white/80 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Chat Ended banner — shown to whichever party did not click End Chat themselves */}
                        {status === 'ENDED' && (
                            <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-2 text-sm flex-shrink-0">
                                <Info size={15} className="flex-shrink-0" />
                                <span>
                                    {endedReason === 'insufficient_balance' && "Chat ended — seeker's balance ran out."}
                                    {endedReason === 'package_time_exhausted' && 'Chat ended — package time exhausted.'}
                                    {endedReason === 'seeker_logged_out' && 'Chat ended — seeker logged out.'}
                                    {endedReason === 'paused_timeout' && 'Chat ended — nobody resumed after it was paused.'}
                                    {(endedReason === 'user_ended' || !endedReason) && 'This chat has ended.'}
                                    {user?.role === 'ASTROLOGER' && ' Returning to dashboard…'}
                                </span>
                            </div>
                        )}

                        {/* Session error (e.g. astrologer already in another chat — Q4) */}
                        {sessionError && (
                            <div className="bg-orange-100 border-b border-orange-300 px-4 py-2 flex items-center gap-2 text-orange-800 text-sm flex-shrink-0">
                                <AlertTriangle size={15} className="flex-shrink-0 text-orange-500" />
                                <span>{sessionError}</span>
                            </div>
                        )}

                        {/* Queue waiting banner for seeker (Q2) */}
                        {user?.role === 'SEEKER' && queueAhead !== null && status !== 'ENDED' && (
                            <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 flex items-center gap-2 text-indigo-800 text-sm flex-shrink-0">
                                <Clock size={15} className="flex-shrink-0 text-indigo-500" />
                                <span>
                                    {queueAhead > 0
                                        ? <>Astrologer is busy — <span className="font-bold">{queueAhead} ahead of you</span>. We'll start as soon as it's your turn.</>
                                        : <>Waiting for the astrologer to respond…</>}
                                </span>
                            </div>
                        )}

                        {/* Chat Paused Overlay */}
                        {status === 'PAUSED' && (
                            <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 rounded-2xl">
                                <div className="text-center">
                                    <div className="text-4xl mb-3">⏸️</div>
                                    <h3 className="text-lg font-bold text-gray-800">Chat Paused</h3>
                                    <p className="text-sm text-gray-900 mt-1">
                                        {pauseReason === 'astrologer_disconnected' && 'Astrologer disconnected. Waiting for them to rejoin.'}
                                        {pauseReason === 'seeker_disconnected' && 'You were disconnected. Ready to resume?'}
                                        {pauseReason === 'insufficient_balance' && 'Your wallet balance ran out.'}
                                        {!pauseReason && 'Chat session is currently paused.'}
                                    </p>
                                </div>

                                {user?.role === 'SEEKER' && (
                                    <div className="w-full max-w-xs space-y-3">
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center text-sm text-gray-600">
                                            Balance: <span className="font-bold text-gray-900">₹{billingInfo.balance.toFixed(2)}</span>
                                        </div>

                                        {/* Quick recharge amounts */}
                                        <div className="flex gap-2 justify-center">
                                            {[50, 100, 200, 500].map(amt => (
                                                <button
                                                    key={amt}
                                                    onClick={() => setRechargeAmount(String(amt))}
                                                    className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${rechargeAmount === String(amt) ? 'bg-[#E91E63] text-white border-[#E91E63]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#E91E63]'}`}
                                                >
                                                    ₹{amt}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={rechargeAmount}
                                                onChange={e => setRechargeAmount(e.target.value)}
                                                placeholder="Custom amount"
                                                min="1"
                                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E91E63]"
                                            />
                                        </div>

                                        <button
                                            onClick={handleInChatRecharge}
                                            disabled={isRecharging || !rechargeAmount}
                                            className="w-full bg-[#E91E63] hover:bg-pink-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isRecharging ? 'Processing...' : 'Add Funds & Resume'}
                                        </button>

                                        <button
                                            onClick={resumeChat}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            Resume with current balance
                                        </button>
                                        {resumeError && (
                                            <p className="text-sm text-red-600 text-center">{resumeError}</p>
                                        )}
                                    </div>
                                )}

                                {user?.role === 'ASTROLOGER' && (
                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            onClick={resumeChat}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            Resume Chat
                                        </button>
                                        {resumeError && (
                                            <p className="text-sm text-red-600 max-w-xs text-center">{resumeError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Waiting-for-astrologer overlay (seeker only) — the astrologer hasn't
                            accepted/joined yet (status stays CONNECTING until their first message
                            starts the timer), so hide the chat panel behind a waiting message
                            instead of letting the seeker see an empty, interactive composer. */}
                        {user?.role === 'SEEKER' && (status === 'CONNECTING' || status === 'ACCEPTED') && (
                            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 rounded-2xl text-center">
                                <div className="w-3 h-3 rounded-full bg-[#E91E63] animate-ping" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {status === 'ACCEPTED'
                                            ? 'Astrologer has joined'
                                            : queueAhead && queueAhead > 0 ? 'Astrologer is busy' : 'Waiting for the astrologer'}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1 max-w-xs">
                                        {status === 'ACCEPTED'
                                            ? `${opponentName || 'The astrologer'} is in the chat and will start typing shortly.`
                                            : queueAhead && queueAhead > 0
                                                ? <><span className="font-bold">{queueAhead}</span> {queueAhead === 1 ? 'seeker is' : 'seekers are'} ahead of you. We'll start as soon as it's your turn.</>
                                                : `${opponentName || 'The astrologer'} has been notified and will accept your request shortly.`}
                                    </p>
                                </div>
                                <button
                                    onClick={handleEndChat}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                    Cancel request
                                </button>
                            </div>
                        )}

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {user?.role === 'SEEKER' && astrologer && messages.length === 0 && (
                                <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-3 flex items-start gap-2 text-sm animate-fade-in">
                                    <Megaphone size={16} className="flex-shrink-0 text-orange-500 mt-0.5" />
                                    <span>
                                        You are connected with <span className="font-bold">{astrologer.display_name || astrologer.full_name}</span>.{' '}
                                        {astrologer.full_name.split(' ')[0]} has guided <span className="font-bold">{astrologer.total_consultations || estimateConsultations(astrologer.id, astrologer.experience_years)}+</span> people with {astrologer.specialties}.
                                    </span>
                                </div>
                            )}
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_id === user?.id;
                                const isImage = msg.message_type === 'image' && !!msg.media_url;
                                const showTranslation = !isImage && !isMe && chatLanguage === 'hi' && msg.id !== undefined;
                                const translation = showTranslation ? translatedText[msg.id as number] : undefined;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl shadow-sm ${isImage ? 'p-2' : 'px-4 py-2'} ${isMe
                                            ? 'bg-[#E91E63] text-white rounded-br-none'
                                            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'
                                            }`}>
                                            {isImage ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImageUrl(resolveImageUrl(msg.media_url))}
                                                    className="block w-full"
                                                >
                                                    <img
                                                        src={resolveImageUrl(msg.media_url)}
                                                        alt={msg.content || 'Kundli Chart'}
                                                        className="rounded-lg max-w-full max-h-64 object-contain bg-white"
                                                    />
                                                </button>
                                            ) : (
                                                <p className="text-sm md:text-base leading-relaxed">{translation || msg.content}</p>
                                            )}
                                            {showTranslation && (
                                                <p className={`text-xs italic mt-1 ${translation ? 'text-gray-400' : 'text-gray-300'}`}>
                                                    {translation ? `Original: ${msg.content}` : 'Translating…'}
                                                </p>
                                            )}
                                            <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-pink-100' : 'text-gray-400'} ${isImage ? 'px-1 pb-0.5' : ''}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {isTyping && (
                                <div className="text-gray-400 text-xs italic px-4 py-1 animate-pulse">
                                    {opponentName} is typing...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Voice input feedback (Astrologer only) */}
                        {user?.role === 'ASTROLOGER' && (speech.isListening || speech.error) && (
                            <div className={`px-4 py-2 text-xs flex items-center gap-2 flex-shrink-0 ${speech.error ? 'bg-red-50 text-red-700' : 'bg-pink-50 text-pink-700'}`}>
                                {speech.error ? (
                                    <span>{speech.error}</span>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span>Listening (Hindi)…</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Groq coaching hint (Astrologer only) — suggests how to respond to the seeker */}
                        {user?.role === 'ASTROLOGER' && coachHint && (
                            <div className="bg-amber-50 border-t border-amber-200 px-4 py-2.5 flex items-start gap-2 text-amber-800 text-sm flex-shrink-0 animate-fade-in">
                                <Lightbulb size={16} className="flex-shrink-0 text-amber-500 mt-0.5" />
                                <span className="flex-1">{coachHint}</span>
                                <button onClick={() => setCoachHint(null)} className="text-amber-400 hover:text-amber-700 flex-shrink-0">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="chat-native-safe-bottom bg-white p-4 border-t border-gray-100 flex flex-col gap-2 flex-shrink-0">
                            {suggestions.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => applySuggestion(s)}
                                            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 hover:border-[#E91E63] hover:text-[#E91E63] transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-3">
                                {user?.role === 'ASTROLOGER' && speech.isSupported && (
                                    <button
                                        type="button"
                                        onClick={toggleVoiceInput}
                                        disabled={status === 'ENDED' || status === 'PAUSED'}
                                        title="Speak in Hindi — converted to Hinglish text"
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${speech.isListening
                                            ? 'bg-red-500 text-white animate-pulse'
                                            : 'bg-gray-50 text-gray-900 border border-gray-200 hover:text-[#E91E63] hover:border-[#E91E63]'
                                            }`}
                                    >
                                        {speech.isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                    </button>
                                )}
                                <div className="relative flex-1">
                                    <textarea
                                        ref={messageInputRef}
                                        value={input}
                                        onChange={handleInputChange}
                                        onSelect={(e) => {
                                            // Only suppresses the onSelect firing right after the
                                            // backspace keystroke that set this flag — reset
                                            // immediately so an unrelated later click/arrow-key
                                            // cursor move still gets suggestions.
                                            if (isDeletingRef.current) { isDeletingRef.current = false; return; }
                                            updateSuggestions(input, e.currentTarget.selectionStart ?? input.length);
                                        }}
                                        onBlur={() => { setSuggestions([]); setSuggestionTarget(null); }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendCurrentInput();
                                            }
                                        }}
                                        placeholder="Type your message..."
                                        spellCheck
                                        lang={chatLanguage === 'hi' ? 'hi' : 'en'}
                                        rows={3}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] text-gray-800 placeholder-gray-400 text-sm transition-all shadow-inner resize-none max-h-40 overflow-y-auto"
                                        disabled={status === 'ENDED' || status === 'PAUSED'}
                                    />
                                    {input && (
                                        <button
                                            type="button"
                                            onClick={clearInput}
                                            onMouseDown={(e) => e.preventDefault()}
                                            title="Clear message"
                                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={status === 'ENDED' || status === 'PAUSED' || !input.trim()}
                                    className="bg-[#E91E63] hover:bg-pink-700 w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 shadow-lg shadow-pink-200 self-end"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* Rating Modal for Seekers */}
            <RatingModal
                isOpen={showRatingModal}
                astrologerName={astrologer?.full_name || 'Astrologer'}
                onSubmit={handleSubmitReview}
                onSkip={handleSkipReview}
            />

            {/* End Chat Confirmation for Seekers */}
            <ConfirmEndChatModal
                isOpen={showEndChatConfirm}
                astrologerName={astrologer?.full_name}
                onConfirm={confirmEndChat}
                onCancel={() => setShowEndChatConfirm(false)}
            />

            {/* Shared-image preview — opened in-app instead of a new browser tab,
                which on the mobile build would leave the WebView and strand the chat. */}
            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <button
                        onClick={() => setPreviewImageUrl(null)}
                        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        aria-label="Close"
                    >
                        <X size={22} />
                    </button>
                    <img
                        src={previewImageUrl}
                        alt="Shared image"
                        onClick={e => e.stopPropagation()}
                        className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                    />
                </div>
            )}

        </div>
    );
};
