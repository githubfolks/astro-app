import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Send, Star, Pencil, Loader2, BadgeCheck, CalendarHeart, MessagesSquare, UserCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AstrologerListItem } from '../types';

const FREE_QUESTION_LIMIT = 5;
const GUEST_DETAILS_KEY = 'ai_astrologer_birth_details';

interface BirthDetails {
    name: string;
    date_of_birth: string;   // YYYY-MM-DD
    time_of_birth: string;   // HH:MM ('' = unknown)
    place_of_birth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const EMPTY_DETAILS: BirthDetails = {
    name: '',
    date_of_birth: '',
    time_of_birth: '',
    place_of_birth: '',
    gender: '',
};

// Pool of suggestions — each visit shows a random four, chips send the text minus the trailing emoji
const SUGGESTED_QUESTIONS = [
    'What does my career look like this year? 💼',
    'When is a good period for marriage? 💍',
    'Which gemstone will suit me? 💎',
    'Is this a good time to start something new? 🚀',
    'Will I get a job promotion soon? 📈',
    'What does my love life look like? ❤️',
    'When will my financial situation improve? 💰',
    'Is foreign travel or settlement in my chart? ✈️',
    'Which day of the week is lucky for me? 🍀',
    'What is my lucky number? 🔢',
    'How can I improve my health this year? 🌿',
    'Should I invest in property now? 🏠',
    'What remedies will bring me peace of mind? 🧘',
    'Is business better than a job for me? ⚖️',
    'When will I buy my own house? 🔑',
    'What does this month hold for me? 🌙',
];

const VISIBLE_SUGGESTIONS = 4;

const HOW_IT_WORKS_STEPS = [
    {
        icon: <CalendarHeart className="w-7 h-7" />,
        step: '01',
        title: 'Share Your Birth Details',
        description: 'Tell Aadi your name, date, time and place of birth — that’s all he needs to read your stars.',
    },
    {
        icon: <MessagesSquare className="w-7 h-7" />,
        step: '02',
        title: 'Ask 5 Free Questions',
        description: 'Career, love, marriage, health or fortune — get warm, instant answers rooted in Vedic wisdom.',
    },
    {
        icon: <UserCheck className="w-7 h-7" />,
        step: '03',
        title: 'Go Deeper with an Expert',
        description: 'Continue with a verified human astrologer for a full kundli analysis — live chat from ₹10/min.',
    },
];

const aiAstrologerStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Aadikarta AI Astrologer",
    "url": "https://aadikarta.org/ai-astrologer",
    "applicationCategory": "LifestyleApplication",
    "description": "Free AI-powered Vedic astrology chat. Enter your birth details and ask 5 free questions about career, love, marriage and more.",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" }
};

const AiAstrologer: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const isSeeker = isAuthenticated && user?.role === 'SEEKER';

    const [details, setDetails] = useState<BirthDetails>(EMPTY_DETAILS);
    const [detailsConfirmed, setDetailsConfirmed] = useState(false);
    const [saveToProfile, setSaveToProfile] = useState(true);
    const [formError, setFormError] = useState('');

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatError, setChatError] = useState('');

    const messagesRef = useRef<HTMLDivElement>(null);

    // Verified astrologers shown in the panel beside the chat
    const [verifiedAstros, setVerifiedAstros] = useState<AstrologerListItem[]>([]);
    useEffect(() => {
        api.astrologers.list(0, 5, 'rating')
            .then(data => { if (Array.isArray(data)) setVerifiedAstros(data); })
            .catch(() => { /* panel is optional — hide it if the fetch fails */ });
    }, []);

    // Server-verified quota — identity is name + date of birth, enforced by the API on every call
    const [questionsUsed, setQuestionsUsed] = useState(0);
    const questionsLeft = Math.max(0, FREE_QUESTION_LIMIT - questionsUsed);
    const limitReached = questionsLeft === 0;

    const syncQuota = async () => {
        try {
            const q = await api.aiAstrologer.quota(details.name.trim(), details.date_of_birth);
            setQuestionsUsed(q.questions_used ?? 0);
        } catch {
            // Informational only — the chat endpoint enforces the limit regardless
        }
    };

    // Shuffle the pool once per visit, then always show the first few not yet asked
    const [shuffledSuggestions] = useState(() => [...SUGGESTED_QUESTIONS].sort(() => Math.random() - 0.5));
    const askedQuestions = new Set(messages.filter(m => m.role === 'user').map(m => m.content));
    const remainingSuggestions = shuffledSuggestions
        .filter(q => !askedQuestions.has(q.replace(/\s\S+$/, '')))
        .slice(0, VISIBLE_SUGGESTIONS);

    // Prefill: logged-in seekers from their saved profile, guests from localStorage
    useEffect(() => {
        let cancelled = false;
        const prefill = async () => {
            if (isSeeker) {
                try {
                    const profile = await api.seekers.getProfile();
                    if (cancelled || !profile) return;
                    setDetails(prev => ({
                        ...prev,
                        name: profile.full_name || prev.name,
                        date_of_birth: profile.date_of_birth || prev.date_of_birth,
                        time_of_birth: profile.time_of_birth ? String(profile.time_of_birth).slice(0, 5) : prev.time_of_birth,
                        place_of_birth: profile.place_of_birth || prev.place_of_birth,
                        gender: profile.gender || prev.gender,
                    }));
                } catch {
                    // Profile fetch is a convenience — the form still works without it
                }
            } else {
                try {
                    const stored = localStorage.getItem(GUEST_DETAILS_KEY);
                    if (stored && !cancelled) setDetails({ ...EMPTY_DETAILS, ...JSON.parse(stored) });
                } catch { /* ignore corrupt storage */ }
            }
        };
        prefill();
        return () => { cancelled = true; };
    }, [isSeeker]);

    // Scroll only the messages panel, not the page
    useEffect(() => {
        const el = messagesRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!details.name.trim() || !details.date_of_birth || !details.place_of_birth.trim() || !details.gender) {
            setFormError('Please fill in your name, date of birth, place of birth and gender.');
            return;
        }

        if (isSeeker && saveToProfile) {
            try {
                await api.seekers.updateProfile({
                    full_name: details.name.trim(),
                    date_of_birth: details.date_of_birth,
                    time_of_birth: details.time_of_birth || null,
                    place_of_birth: details.place_of_birth.trim(),
                    gender: details.gender,
                });
            } catch {
                // Saving the profile is best-effort; the chat should still open
            }
        }
        if (!isAuthenticated) {
            try { localStorage.setItem(GUEST_DETAILS_KEY, JSON.stringify(details)); } catch { /* storage full/blocked */ }
        }
        await syncQuota();
        setDetailsConfirmed(true);
    };

    const sendQuestion = async (question: string) => {
        const trimmed = question.trim();
        if (!trimmed || isTyping || limitReached) return;

        setChatError('');
        setInput('');
        const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
        setMessages(nextMessages);
        setIsTyping(true);

        try {
            const res = await api.aiAstrologer.chat({
                birth_details: {
                    name: details.name.trim(),
                    date_of_birth: details.date_of_birth,
                    time_of_birth: details.time_of_birth || null,
                    place_of_birth: details.place_of_birth.trim(),
                    gender: details.gender,
                },
                messages: nextMessages,
            });
            setMessages([...nextMessages, { role: 'assistant', content: res.reply }]);
            setQuestionsUsed(res.questions_used ?? questionsUsed + 1);
        } catch (err) {
            // Roll back the unanswered question so the user can retry it
            setMessages(messages);
            setInput(trimmed);
            setChatError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            // Re-verify the counter with the server (e.g. quota exhausted in another tab)
            syncQuota();
        } finally {
            setIsTyping(false);
        }
    };

    const inputBase = 'w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition-all [color-scheme:dark]';

    return (
        <div className="ai-astrologer-page pb-20 md:pb-0">
            <SEO
                title="Free AI Astrologer Chat | Ask 5 Questions Online"
                description="Chat with Aadi, our AI Vedic astrologer. Enter your birth details and get 5 free instant answers about career, love, marriage & more."
                structuredData={aiAstrologerStructuredData}
            />
            <Header />

            <main className="relative min-h-screen overflow-hidden">
                {/* Midnight celestial background (matches home page's celestial section) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#1e1b4b,0%,#0f172a_100%)]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

                <div className="container mx-auto px-4 relative z-10 pt-28 pb-16">
                    {/* Page heading */}
                    <div className="max-w-3xl mx-auto text-center mb-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-6">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-200 text-sm font-semibold tracking-wide">FREE · 5 QUESTIONS · INSTANT ANSWERS</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl text-white mb-4 leading-tight">
                            Ask <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">Aadi</span>, Your AI Astrologer
                        </h1>
                        <p className="text-lg md:text-xl text-indigo-100/70 font-light max-w-2xl mx-auto">
                            Share your birth details and let ancient Vedic wisdom, powered by AI, illuminate your path — career, love, marriage and more.
                        </p>
                    </div>

                    <div className={detailsConfirmed
                        ? 'max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-stretch'
                        : 'max-w-3xl mx-auto'}>
                        {!detailsConfirmed ? (
                            /* ---------- Step 1: Birth details ---------- */
                            <form
                                onSubmit={handleDetailsSubmit}
                                className="bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">🔮</div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Your Birth Details</h2>
                                        <p className="text-indigo-200/60 text-sm">Aadi needs these to read your stars accurately</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-indigo-100 text-sm font-medium mb-2">Full Name *</label>
                                        <input
                                            type="text"
                                            value={details.name}
                                            onChange={e => setDetails({ ...details, name: e.target.value })}
                                            placeholder="e.g. Ananya Sharma"
                                            maxLength={100}
                                            className={inputBase}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-indigo-100 text-sm font-medium mb-2">Date of Birth *</label>
                                        <input
                                            type="date"
                                            value={details.date_of_birth}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={e => setDetails({ ...details, date_of_birth: e.target.value })}
                                            className={inputBase}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-indigo-100 text-sm font-medium mb-2">Time of Birth <span className="text-indigo-300/50 font-normal">(if known)</span></label>
                                        <input
                                            type="time"
                                            value={details.time_of_birth}
                                            onChange={e => setDetails({ ...details, time_of_birth: e.target.value })}
                                            className={inputBase}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-indigo-100 text-sm font-medium mb-2">Place of Birth *</label>
                                        <input
                                            type="text"
                                            value={details.place_of_birth}
                                            onChange={e => setDetails({ ...details, place_of_birth: e.target.value })}
                                            placeholder="e.g. Jaipur, Rajasthan"
                                            maxLength={150}
                                            className={inputBase}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-indigo-100 text-sm font-medium mb-2">Gender *</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['MALE', 'FEMALE', 'OTHER'] as const).map(g => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setDetails({ ...details, gender: g })}
                                                    className={`py-3 rounded-2xl text-sm font-semibold border transition-all ${details.gender === g
                                                        ? 'bg-amber-400 text-indigo-950 border-amber-400 shadow-lg shadow-amber-500/20'
                                                        : 'bg-white/10 text-indigo-100 border-white/20 hover:bg-white/20'}`}
                                                >
                                                    {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {isSeeker ? (
                                    <label className="flex items-center gap-3 mt-6 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={saveToProfile}
                                            onChange={e => setSaveToProfile(e.target.checked)}
                                            className="w-5 h-5 rounded accent-amber-400"
                                        />
                                        <span className="text-indigo-100 text-sm">Save these details to my profile for next time</span>
                                    </label>
                                ) : (
                                    <p className="mt-6 text-indigo-200/60 text-sm">
                                        ✨ <Link to="/login" className="text-amber-300 hover:text-amber-200 underline underline-offset-2">Log in</Link> to save your details so we remember you next time.
                                    </p>
                                )}

                                {formError && (
                                    <p className="mt-4 text-rose-300 text-sm bg-rose-500/10 border border-rose-400/20 rounded-xl px-4 py-3">{formError}</p>
                                )}

                                <button
                                    type="submit"
                                    className="group relative w-full mt-8 py-4 rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
                                    <span className="relative text-indigo-950 flex items-center justify-center gap-2">
                                        Reveal My Stars <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                                    </span>
                                </button>
                            </form>
                        ) : (
                            /* ---------- Step 2: Verified astrologers + chat ---------- */
                            <>
                            <aside className="order-2 lg:order-1 bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-[2.5rem] shadow-2xl p-6 flex flex-col">
                                <div className="flex items-center gap-2 mb-5">
                                    <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                                    <h2 className="text-white font-bold">Talk to a Verified Astrologer</h2>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
                                    {verifiedAstros.length > 0 ? verifiedAstros.map(a => (
                                        <Link
                                            key={a.user_id}
                                            to={`/astrologers/${a.slug || a.user_id}`}
                                            className="flex items-center gap-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded-2xl p-3 transition-all"
                                        >
                                            <div className="relative shrink-0">
                                                {a.profile_picture_url ? (
                                                    <img src={a.profile_picture_url} alt={a.full_name || 'Astrologer'} className="w-11 h-11 rounded-xl object-cover" />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                        {(a.full_name || 'A').charAt(0)}
                                                    </div>
                                                )}
                                                {a.is_online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-indigo-950"></span>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white text-sm font-semibold truncate">{a.full_name || 'Astrologer'}</p>
                                                <p className="text-indigo-200/60 text-xs truncate">{a.specialties || 'Vedic'}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-amber-300 text-xs font-semibold flex items-center justify-end gap-1">
                                                    {/* rating_avg arrives as a string from the API despite the number type */}
                                                    <Star className="w-3 h-3 fill-amber-300" />{(Number(a.rating_avg) || 5).toFixed(1)}
                                                </p>
                                                <p className="text-indigo-200/60 text-xs">₹{Number(a.consultation_fee_per_min) || 10}/min</p>
                                            </div>
                                        </Link>
                                    )) : (
                                        <p className="text-indigo-200/60 text-sm">Loading astrologers…</p>
                                    )}
                                </div>
                                <Link
                                    to="/astrologers"
                                    className="mt-5 block text-center bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-indigo-950 font-bold px-6 py-3 rounded-2xl hover:scale-[1.02] transition-transform"
                                >
                                    View All Astrologers →
                                </Link>
                            </aside>

                            <div className="order-1 lg:order-2 bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col" style={{ minHeight: '60vh' }}>
                                {/* Chat header */}
                                <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-white/5">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shrink-0">🔮</div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold leading-tight">Pandit Aadi</p>
                                            <p className="text-indigo-200/60 text-xs truncate">
                                                Reading the stars for {details.name.split(' ')[0]}
                                                <button
                                                    onClick={() => setDetailsConfirmed(false)}
                                                    className="ml-2 inline-flex items-center gap-1 text-amber-300 hover:text-amber-200"
                                                >
                                                    <Pencil className="w-3 h-3" /> edit
                                                </button>
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold border ${limitReached
                                        ? 'bg-rose-500/15 text-rose-300 border-rose-400/20'
                                        : 'bg-amber-400/15 text-amber-300 border-amber-400/20'}`}>
                                        <Star className="w-3.5 h-3.5" />
                                        {questionsLeft} of {FREE_QUESTION_LIMIT} left
                                    </div>
                                </div>

                                {/* Messages */}
                                <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4" style={{ maxHeight: '55vh' }}>
                                    {/* Welcome bubble */}
                                    <div className="flex items-end gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-base shrink-0">🔮</div>
                                        <div className="bg-white/10 border border-white/10 rounded-3xl rounded-bl-lg px-5 py-3.5 text-indigo-50 max-w-[85%] leading-relaxed">
                                            Namaste {details.name.split(' ')[0]} 🙏 I have your birth details before me. The cosmos is listening — ask me anything about your career, love, marriage, health habits or fortune. You have {questionsLeft} free {questionsLeft === 1 ? 'question' : 'questions'}. ✨
                                        </div>
                                    </div>

                                    {messages.map((msg, i) => (
                                        msg.role === 'user' ? (
                                            <div key={i} className="flex justify-end">
                                                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl rounded-br-lg px-5 py-3.5 text-white max-w-[85%] leading-relaxed shadow-lg shadow-indigo-900/30">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={i} className="flex items-end gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-base shrink-0">🔮</div>
                                                <div className="bg-white/10 border border-white/10 rounded-3xl rounded-bl-lg px-5 py-3.5 text-indigo-50 max-w-[85%] leading-relaxed whitespace-pre-line">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        )
                                    ))}

                                    {isTyping && (
                                        <div className="flex items-end gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-base shrink-0">🔮</div>
                                            <div className="bg-white/10 border border-white/10 rounded-3xl rounded-bl-lg px-5 py-4 flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Limit-reached CTA */}
                                    {limitReached && !isTyping && (
                                        <div className="mt-6 rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-indigo-500/10 p-6 text-center">
                                            <div className="text-4xl mb-3">🌟</div>
                                            <h3 className="text-white font-bold text-lg mb-2">Your free questions are complete!</h3>
                                            <p className="text-indigo-100/70 text-sm mb-5 max-w-md mx-auto">
                                                The stars have much more to reveal. Get a deep, personalised kundli analysis from our verified human astrologers — live chat from just ₹10/min.
                                            </p>
                                            <Link
                                                to="/astrologers"
                                                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-indigo-950 font-bold px-8 py-3.5 rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-amber-500/20"
                                            >
                                                Talk to a Verified Astrologer →
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Suggested questions (until the free limit is used up) */}
                                {!limitReached && remainingSuggestions.length > 0 && (
                                    <div className="px-4 md:px-6 pb-3 flex flex-wrap gap-2">
                                        {remainingSuggestions.map(q => (
                                            <button
                                                key={q}
                                                disabled={isTyping}
                                                onClick={() => sendQuestion(q.replace(/\s\S+$/, ''))}
                                                className="text-sm text-indigo-100 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-4 py-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {chatError && (
                                    <p className="mx-4 md:mx-6 mb-3 text-rose-300 text-sm bg-rose-500/10 border border-rose-400/20 rounded-xl px-4 py-2.5">{chatError}</p>
                                )}

                                {/* Input bar */}
                                <div className="px-4 md:px-6 pb-5 pt-2 border-t border-white/10 bg-white/5">
                                    <form
                                        onSubmit={e => { e.preventDefault(); sendQuestion(input); }}
                                        className="flex items-center gap-3 mt-3"
                                    >
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            disabled={limitReached || isTyping}
                                            maxLength={2000}
                                            placeholder={limitReached ? 'Free questions used — consult our astrologers ✨' : 'Ask about career, love, marriage…'}
                                            className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3.5 text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition-all disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={limitReached || isTyping || !input.trim()}
                                            aria-label="Send question"
                                            className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-indigo-950 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-40 disabled:hover:scale-100 shadow-lg shadow-amber-500/25"
                                        >
                                            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        </button>
                                    </form>
                                    <p className="text-center text-indigo-300/40 text-xs mt-3">
                                        For guidance & entertainment. For important decisions, consult our <Link to="/astrologers" className="underline hover:text-indigo-200">verified astrologers</Link>.
                                    </p>
                                </div>
                            </div>
                            </>
                        )}
                    </div>

                    {/* How it works — in the page's celestial glass look */}
                    <div className="max-w-5xl mx-auto mt-20 md:mt-24">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl text-white mb-3">
                                How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">Works</span>
                            </h2>
                            <p className="text-indigo-100/60 font-light max-w-xl mx-auto">
                                Your journey from curiosity to cosmic clarity, in three simple steps.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {HOW_IT_WORKS_STEPS.map(s => (
                                <div
                                    key={s.step}
                                    className="relative bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-[2rem] p-7 hover:bg-white/[0.12] hover:-translate-y-1 transition-all duration-300"
                                >
                                    <span className="absolute top-4 right-6 text-6xl font-black text-white/[0.06] select-none">{s.step}</span>
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-indigo-950 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                                        {s.icon}
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                                    <p className="text-indigo-100/60 text-sm leading-relaxed">{s.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AiAstrologer;
