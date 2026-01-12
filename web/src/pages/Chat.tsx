import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RatingModal from '../components/RatingModal';
import { Send, Clock, User, ArrowLeft } from 'lucide-react';
import type { Astrologer } from '../types';
import { api } from '../services/api';

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


    const { messages, sendMessage, endChat, status, billingInfo, timerActive } = useChat(activeConsultationId || '');

    useEffect(() => {
        scrollToBottom();
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
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <Header />

            <main className="flex-1 container mx-auto p-4 md:p-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-[#E91E63] transition-colors font-medium w-fit"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="h-[calc(100vh-200px)] min-h-[600px] flex gap-6">

                    {/* Left Panel: Details (Astrologer OR Seeker) */}
                    <div className="hidden md:flex flex-col w-1/3 bg-white rounded-2xl shadow-lg overflow-y-auto border border-gray-100 p-6">
                        {user?.role === 'SEEKER' ? (
                            // Show ASTROLOGER Profile to Seeker
                            astrologer ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center text-center">
                                        {astrologer.profile_picture_url ? (
                                            <img
                                                src={astrologer.profile_picture_url}
                                                alt={astrologer.full_name}
                                                className="w-32 h-32 rounded-full object-cover border-4 border-[#FFB700] shadow-md mb-4"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-purple-100 flex items-center justify-center border-4 border-[#FFB700] shadow-md mb-4 text-purple-600">
                                                <User size={64} />
                                            </div>
                                        )}
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
                                            <h3 className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">Chart Notes</h3>
                                            <p className="text-yellow-900 text-sm">
                                                (Placeholder for Kundli/Chart data. To be implemented.)
                                            </p>
                                        </div>
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

                    {/* Right Panel: Chat Interface */}
                    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        {/* Chat Header */}
                        <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center z-10">
                            <div className="flex items-center gap-4">
                                {/* Mobile only profile summary */}
                                <div className="md:hidden flex items-center gap-3">
                                    {astrologer?.profile_picture_url ? (
                                        <img src={astrologer.profile_picture_url} className="w-10 h-10 rounded-full border-2 border-[#FFB700]" alt="Profile" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border-2 border-[#FFB700] text-purple-600"><User size={20} /></div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{astrologer?.full_name}</h3>
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
                                {timerActive ? (
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
                                    <div className="text-sm hidden sm:block text-gray-600">
                                        <span>Spent: </span> <span className="text-gray-900 font-bold font-mono">₹{billingInfo.spent}</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleEndChat}
                                    className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-red-200"
                                >
                                    End Chat
                                </button>
                            </div>
                        </div>

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
                        <form onSubmit={handleSend} className="bg-white p-4 border-t border-gray-100 flex gap-3">
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
            <Footer />

            {/* Rating Modal for Seekers */}
            <RatingModal
                isOpen={showRatingModal}
                astrologerName={astrologer?.full_name || 'Astrologer'}
                onSubmit={handleSubmitReview}
                onSkip={handleSkipReview}
            />
        </div>
    );
};
