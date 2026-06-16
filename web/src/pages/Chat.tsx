import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RatingModal from '../components/RatingModal';
import KundliPanel from '../components/KundliPanel';
import { Send, Clock, User, ArrowLeft, Info, X, AlertTriangle } from 'lucide-react';
import type { Astrologer } from '../types';
import { api } from '../services/api';
import { resolveImageUrl } from '../utils/url';

export const Chat: React.FC = () => {
    const { consultationId, astrologerId } = useParams<{ consultationId: string; astrologerId: string }>();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    // State
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [activeConsultationId, setActiveConsultationId] = useState<string | undefined>(consultationId);
    const [astrologer, setAstrologer] = useState<Astrologer | null>(null);
    const [seeker, setSeeker] = useState<any | null>(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showKundli, setShowKundli] = useState(false);
    const [kundliData, setKundliData] = useState<any>(null);
    const [kundliLoading, setKundliLoading] = useState(false);
    const [kundliError, setKundliError] = useState<string | null>(null);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [showSidebarMobile, setShowSidebarMobile] = useState(false);

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

    // Initialize consultation or set active ID
    useEffect(() => {
        if (astrologerId && !consultationId && token && user) {
            const createNewConsultation = async () => {
                try {
                    const data = await api.consultations.create({
                        astrologer_id: parseInt(astrologerId),
                        consultation_type: 'CHAT'
                    });
                    navigate(`/chat/${data.id}`, { replace: true });
                } catch (error: any) {
                    console.error("Error creating consultation:", error);
                    alert(error.message || "Failed to start chat session. Please try again.");
                    navigate('/dashboard');
                }
            };

            createNewConsultation();
        } else if (consultationId) {
            setActiveConsultationId(consultationId);
        }
    }, [astrologerId, consultationId, token, user, navigate]);

    // Fetch Profile Data (Astrologer OR Seeker)
    useEffect(() => {
        if (!activeConsultationId || !token || !user) return;

        const fetchProfile = async () => {
            try {
                // 1. Get Consultation Details
                const consultData = await api.consultations.getOne(activeConsultationId);

                // If I am a SEEKER, I want to see the ASTROLOGER
                if (user.role === 'SEEKER') {
                    const astroId = consultData.astrologer_id;
                    const astroData = await api.astrologers.getOne(astroId);
                    setAstrologer({
                        id: astroData.user_id,
                        full_name: astroData.full_name,
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

            } catch (err: any) {
                console.error("Failed to load profile data", err);
            }
        };

        fetchProfile();
    }, [activeConsultationId, token, user]);


    const { messages, sendMessage, endChat, resumeChat, status, pauseReason, billingInfo, timerActive, lowBalance } = useChat(activeConsultationId || '');

    const [rechargeAmount, setRechargeAmount] = useState('');
    const [isRecharging, setIsRecharging] = useState(false);

    const handleInChatRecharge = async () => {
        const amt = Number(rechargeAmount);
        if (!rechargeAmount || isNaN(amt) || amt <= 0) return;
        try {
            setIsRecharging(true);
            const orderData = await api.payment.createOrder(amt);
            if (orderData.key_id === 'mock_key' || !orderData.key_id) {
                const ok = confirm(`[DEV] Simulate ₹${amt} payment?`);
                if (ok) {
                    await api.payment.verifyPayment({
                        razorpay_order_id: orderData.order_id,
                        razorpay_payment_id: 'pay_mock_' + Date.now(),
                        razorpay_signature: 'mock_signature'
                    });
                    setRechargeAmount('');
                    resumeChat();
                }
                setIsRecharging(false);
                return;
            }
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'AadiKarta',
                description: 'Wallet Recharge',
                order_id: orderData.order_id,
                handler: async (response: any) => {
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
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', (r: any) => alert('Payment failed: ' + r.error.description));
            rzp.open();
        } catch (e: any) {
            alert('Failed to initiate payment: ' + (e.message || 'Unknown error'));
        } finally {
            setIsRecharging(false);
        }
    };

    // Get opponent info (Astrologer if Seeker, Seeker if Astrologer)
    const opponent = user?.role === 'SEEKER' ? astrologer : (seeker ? {
        full_name: seeker.full_name || 'Client',
        profile_picture_url: null, // Seekers don't have profile pics in schema?
    } : null);

    useEffect(() => {
        // Double scroll to ensure layout has settled
        scrollToBottom();
        const timer = setTimeout(scrollToBottom, 50);
        return () => clearTimeout(timer);
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    };

    const handleEndChat = () => {
        endChat();
        // Show rating modal for Seekers
        if (user?.role === 'SEEKER') {
            setShowRatingModal(true);
        } else {
            navigate('/dashboard');
        }
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

    const handleViewKundli = async () => {
        if (!seeker) return;

        // If already loaded, just open the panel
        if (kundliData) {
            setShowKundli(true);
            return;
        }

        setShowKundli(true);
        setKundliLoading(true);
        setKundliError(null);

        try {
            const data = await api.kundli.generate({
                seeker_id: seeker.user_id,
                full_name: seeker.full_name || 'Seeker',
                date_of_birth: seeker.date_of_birth,
                time_of_birth: seeker.time_of_birth,
                place_of_birth: seeker.place_of_birth,
            });
            setKundliData(data.chart_data);
        } catch (err: any) {
            setKundliError(err.message || 'Failed to generate Kundli. Please try again.');
        } finally {
            setKundliLoading(false);
        }
    };

    if (astrologerId && !consultationId) {
        return (
            <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E91E63] mb-4"></div>
                    <p className="text-gray-600 font-medium">Initializing secure chat session...</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 flex flex-col overflow-hidden bg-[#FFF9F0]"
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
                            ? 'flex fixed inset-0 z-50 bg-white p-6 m-4 rounded-2xl shadow-2xl animate-in slide-in-from-left duration-300 overflow-y-auto'
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
                                            src={resolveImageUrl(astrologer.profile_picture_url, astrologer.full_name)}
                                            alt={astrologer.full_name}
                                            className="w-32 h-32 rounded-full object-cover border-4 border-[#FFB700] shadow-md mb-4"
                                        />
                                        <h2 className="text-2xl font-bold text-gray-900">{astrologer.full_name}</h2>
                                        <p className="text-[#E91E63] font-semibold">{astrologer.specialties}</p>

                                        <div className="flex items-center gap-2 mt-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                            <div className={`w-2 h-2 rounded-full ${astrologer.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                            <span className="text-xs font-bold text-green-700 uppercase tracking-wide">{astrologer.is_online ? "Online Now" : "Offline"}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                            <span className="block text-2xl font-bold text-gray-900">{astrologer.rating_avg}</span>
                                            <span className="text-xs text-gray-500 uppercase font-semibold">Rating</span>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                            <span className="block text-2xl font-bold text-gray-900">{astrologer.experience_years}+</span>
                                            <span className="text-xs text-gray-500 uppercase font-semibold">Years Exp.</span>
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
                                            <p className="text-gray-900 font-bold text-lg">₹{astrologer.consultation_fee_per_min}<span className="text-sm text-gray-500 font-normal">/min</span></p>
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
                                        <span className="text-sm text-gray-500 font-medium">Client Details</span>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-gray-100">

                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
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

                                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                            <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">Notes</h3>
                                            <p className="text-yellow-900 text-sm">
                                                No additional notes.
                                            </p>
                                        </div>

                                        {/* View Kundli Button */}
                                        {seeker.date_of_birth && seeker.time_of_birth && seeker.place_of_birth ? (
                                            <button
                                                onClick={handleViewKundli}
                                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                                            >
                                                🔮 View Kundli
                                            </button>
                                        ) : (
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                                                <p className="text-gray-400 text-xs">Birth details not available for Kundli generation</p>
                                            </div>
                                        )}
                                    </div>
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
                        <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center z-10">
                            <div className="flex items-center gap-4">
                                {/* Mobile only profile summary */}
                                <div className="md:hidden flex items-center gap-3">
                                    <img src={resolveImageUrl((opponent as any).profile_picture_url, (opponent as any).full_name)} className="w-10 h-10 rounded-full border-2 border-[#FFB700]" alt="Profile" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{(opponent as any)?.full_name || 'Loading...'}</h3>
                                        <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">● Live</span>
                                    </div>
                                </div>

                                {/* Desktop Header Title */}
                                <div className="hidden md:block">
                                    <h2 className="font-bold text-lg text-gray-800">Chat Session</h2>
                                    <span className="text-xs text-gray-400">ID: {consultationId}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {status === 'PAUSED' ? (
                                    <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 text-sm font-medium animate-pulse">
                                        <Clock size={16} />
                                        <span className="font-mono">Paused</span>
                                    </div>
                                ) : timerActive ? (
                                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 text-sm font-medium">
                                        <Clock size={16} />
                                        <span className="font-mono">Active</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200 text-sm font-medium">
                                        <Clock size={16} />
                                        <span className="font-mono">Waiting</span>
                                    </div>
                                )}

                                {user?.role === 'SEEKER' && (
                                    <div className={`text-sm hidden sm:flex items-center gap-3 ${lowBalance ? 'text-amber-700' : 'text-gray-600'}`}>
                                        <span>Balance: <span className={`font-bold font-mono ${lowBalance ? 'text-amber-700' : 'text-gray-900'}`}>₹{billingInfo.balance.toFixed(2)}</span></span>
                                        <span className="text-gray-300">|</span>
                                        <span>Spent: <span className="font-bold font-mono text-gray-900">₹{billingInfo.spent}</span></span>
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowSidebarMobile(true)}
                                    className="md:hidden p-2 text-gray-500 hover:text-[#E91E63] bg-gray-50 rounded-full border border-gray-200 transition-colors"
                                    aria-label="View Profile Info"
                                >
                                    <Info size={20} />
                                </button>

                                <button
                                    onClick={handleEndChat}
                                    className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-red-200"
                                >
                                    End Chat
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

                        {/* Chat Paused Overlay */}
                        {status === 'PAUSED' && (
                            <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 rounded-2xl">
                                <div className="text-center">
                                    <div className="text-4xl mb-3">⏸️</div>
                                    <h3 className="text-lg font-bold text-gray-800">Chat Paused</h3>
                                    <p className="text-sm text-gray-500 mt-1">
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
                                    </div>
                                )}

                                {user?.role === 'ASTROLOGER' && (
                                    <button
                                        onClick={resumeChat}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Resume Chat
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_id === user?.id;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                        <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm ${isMe
                                            ? 'bg-[#E91E63] text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                            }`}>
                                            <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                                            <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-pink-100' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="bg-white p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-3 focus:outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] text-gray-800 placeholder-gray-400 text-sm transition-all shadow-inner"
                                disabled={status === 'ENDED'}
                            />
                            <button
                                type="submit"
                                disabled={status === 'ENDED' || !input.trim()}
                                className="bg-[#E91E63] hover:bg-pink-700 w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 shadow-lg shadow-pink-200"
                            >
                                <Send size={20} />
                            </button>
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

            {/* Kundli Panel */}
            <KundliPanel
                isOpen={showKundli}
                onClose={() => setShowKundli(false)}
                chartData={kundliData}
                seekerName={seeker?.full_name || 'Seeker'}
                loading={kundliLoading}
                error={kundliError}
            />
        </div>
    );
};
