import type { AstrologerProfile, SeekerProfile } from '../types';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useRealtime } from '../context/RealtimeContext';
import {
    Star,
    MessageCircle,
    Clock,
    Award,
    CheckCircle,
    Calendar,
    Users,
    ChevronRight,
    Heart,
    Bell
} from 'lucide-react';

import { resolveImageUrl, getAstrologerDisplayName } from '../utils/url';
import { estimateConsultations } from '../utils/estimateStats';
import SEO from '../components/SEO';

const AstrologerProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // numeric id until backend supports name-based slugs
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [astrologer, setAstrologer] = useState<AstrologerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [seekerProfile, setSeekerProfile] = useState<SeekerProfile | null>(null);
    const [notified, setNotified] = useState(false);
    const [reviews, setReviews] = useState<Array<{ rating: number, comment: string, seeker_display_name: string }>>([]);
    // Only seekers can subscribe to availability alerts (backend rejects everyone
    // else) — gate the Knock button on this instead of showing it to everyone and
    // letting the request fail.
    const canNotify = isAuthenticated && user?.role === 'SEEKER';
    const canKnock = canNotify && !!astrologer?.knockable;

    const getStructuredData = (ast: AstrologerProfile) => ({
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Person",
                "@id": `https://aadikarta.org/astrologers/${ast.slug || ast.user_id}#person`,
                "name": getAstrologerDisplayName(ast),
                "jobTitle": "Astrologer",
                "description": ast.about_me,
                "image": ast.profile_picture_url,
                "knowsAbout": ast.specialties?.split(',').map((s: string) => s.trim()) || []
            },
            {
                "@type": "ProfessionalService",
                "name": `${getAstrologerDisplayName(ast)} - Vedic Astrologer on Aadikarta`,
                "image": ast.profile_picture_url,
                "priceRange": "₹₹",
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": ast.rating_avg || 5,
                    "reviewCount": ast.total_consultations || 10
                }
            }
        ]
    });

    // A rapid logout->login (or an auth-token reconnect racing this page's own
    // id-change fetch) can leave two `getOne` requests in flight; only the
    // response to the most recently issued one may commit, otherwise a stale,
    // differently-authenticated response can overwrite fresh state (e.g. an
    // online astrologer reverting to a stale Offline/Knock display).
    const latestRequestId = React.useRef(0);

    const fetchAstrologer = useCallback(() => {
        if (!id) return;
        const requestId = ++latestRequestId.current;
        api.astrologers.getOne(id)
            .then(data => {
                if (requestId !== latestRequestId.current) return;
                setAstrologer(data);
                setLoading(false);
                // Redirect numeric-ID URLs to the canonical slug URL
                if (data.slug && /^\d+$/.test(id)) {
                    navigate(`/astrologers/${data.slug}`, { replace: true });
                }
            })
            .catch(err => {
                console.error('Failed to fetch astrologer', err);
                setLoading(false);
            });
    }, [id, navigate]);

    useEffect(() => {
        fetchAstrologer();
    }, [fetchAstrologer]);

    useEffect(() => {
        if (!astrologer?.user_id) return;
        api.cms.getReviews(6, astrologer.user_id)
            .then(setReviews)
            .catch(() => { /* section just won't render */ });
    }, [astrologer?.user_id]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'SEEKER') {
            api.seekers.getProfile()
                .then(setSeekerProfile)
                .catch(console.error);
        }
    }, [isAuthenticated, user]);

    useRealtime((event) => {
        if (event.type === 'REALTIME_RECONNECTED') {
            // Any ASTRO_ONLINE/OFFLINE broadcast missed while this socket was
            // down (e.g. app backgrounded) would otherwise leave this page
            // showing stale Offline/Knock state indefinitely — resync via REST.
            fetchAstrologer();
            return;
        }
        const isThisAstrologer = event.astrologer_id && (String(event.astrologer_id) === String(astrologer?.user_id) || String(event.astrologer_id) === String(id));
        if (event.type === 'ASTRO_ONLINE' && isThisAstrologer) {
            setAstrologer(prev => prev ? {
                ...prev,
                is_online: true,
                availability_status: 'ONLINE'
            } : null);
        } else if (event.type === 'ASTRO_OFFLINE' && isThisAstrologer) {
            setAstrologer(prev => prev ? {
                ...prev,
                is_online: false,
                availability_status: 'OFFLINE'
            } : null);
        }
    });

    const isProfileComplete = (profile: SeekerProfile | null) => {
        return profile?.date_of_birth && profile?.time_of_birth && profile?.place_of_birth && profile?.gender;
    };

    const handleStartChat = async () => {
        if (!isAuthenticated) {
            setIsLoginModalOpen(true);
            return;
        }

        if (user?.role === 'ASTROLOGER') {
            alert("As an astrologer, you cannot initiate a chat with another astrologer.");
            return;
        }

        if (!isProfileComplete(seekerProfile)) {
            setIsProfileModalOpen(true);
            return;
        }

        // Require at least one minute of balance at this astrologer's rate before
        // entering the chat, so seekers aren't dropped into a session that ends
        // immediately for insufficient balance.
        try {
            const wallet = await api.wallet.getBalance();
            const rate = astrologer?.consultation_fee_per_min ?? 0;
            if (Number(wallet.balance) < rate) {
                setIsPaymentModalOpen(true);
                return;
            }
        } catch (err) {
            console.error('Failed to verify wallet balance', err);
            alert('Could not verify your wallet balance. Please try again.');
            return;
        }

        navigate(`/chat/new/${id}`);
    };

    const handlePaymentSuccess = async () => {
        setIsPaymentModalOpen(false);
        try {
            const wallet = await api.wallet.getBalance();
            const rate = astrologer?.consultation_fee_per_min ?? 0;
            if (Number(wallet.balance) < rate) {
                alert(`That top-up still isn't enough for this astrologer's rate (₹${rate}/min). Please add more to start the chat.`);
                return;
            }
        } catch (err) {
            console.error('Failed to verify wallet balance', err);
            return;
        }
        navigate(`/chat/new/${id}`);
    };

    const handleNotify = async () => {
        if (!id) return;
        try {
            await api.astrologers.notifyWhenOnline(id);
            setNotified(true);
        } catch (err) {
            console.error('Failed to subscribe to availability alerts', err);
            alert('Failed to set up the alert. Please try again.');
        }
    };

    const handleProfileComplete = () => {
        setIsProfileModalOpen(false);
        navigate(`/chat/new/${id}`);
    };

    const handleLoginSuccess = () => {
        api.seekers.getProfile()
            .then((profile) => {
                setSeekerProfile(profile);
                if (!isProfileComplete(profile)) {
                    setIsProfileModalOpen(true);
                } else {
                    navigate(`/chat/new/${id}`);
                }
            })
            .catch(console.error);
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="animate-spin h-12 w-12 border-4 border-[#E91E63] rounded-full border-t-transparent"></div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!astrologer) {
        return (
            <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Astrologer Not Found</h2>
                        <p className="text-gray-600">The astrologer you're looking for doesn't exist.</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const specialtiesArray = astrologer.specialties?.split(',').map((s: string) => s.trim()) || [];
    const languagesArray = astrologer.languages?.split(',').map((l: string) => l.trim()) || [];
    const status = astrologer.availability_status || (astrologer.is_online ? 'ONLINE' : 'OFFLINE');
    const displayName = getAstrologerDisplayName(astrologer);

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <SEO
                title={`Talk to ${displayName} (${astrologer.rating_avg ? `${astrologer.rating_avg.toFixed(1)}★` : 'Verified'}) | Astrologer | Aadikarta`}
                description={`Consult with ${displayName} (${astrologer.rating_avg ? `${astrologer.rating_avg.toFixed(1)}★` : '5.0★'} rating, ${astrologer.experience_years}+ yrs exp) on Aadikarta from ₹${astrologer.consultation_fee_per_min || 10}/min. Expert in ${specialtiesArray.slice(0, 3).join(', ')}.`}
                keywords={`Aadikarta Vedic Astrology, ${displayName}, talk to ${displayName}, ${specialtiesArray.slice(0, 3).join(', ')}, online astrologer consultation`}
                image={resolveImageUrl(astrologer.profile_picture_url, displayName)}
                structuredData={getStructuredData(astrologer)}
                canonicalPath={`/astrologers/${astrologer.slug || astrologer.user_id}`}
            />
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white py-6 md:py-12">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start">
                            {/* Profile Image */}
                            <div className="relative">
                                <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl bg-gradient-to-br from-purple-400 to-pink-500">
                                    <img
                                        src={resolveImageUrl(astrologer.profile_picture_url, displayName)}
                                        alt={displayName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {status === 'ONLINE' ? (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        Online
                                    </div>
                                ) : status === 'BUSY' ? (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                        Busy
                                    </div>
                                ) : (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                                        Offline
                                    </div>
                                )}
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <CheckCircle size={20} className="text-blue-400" />
                                    <span className="text-sm text-blue-300 font-medium">Verified Expert</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-normal mb-3">{displayName}</h1>

                                {/* Rating & Stats */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                                    {Number(astrologer.rating_avg) > 0 ? (
                                        <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                                            <Star size={18} fill="#FFD700" stroke="#FFD700" />
                                            <span className="font-bold text-yellow-400">{Number(astrologer.rating_avg).toFixed(1)}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 bg-indigo-500/20 px-3 py-1 rounded-full">
                                            <span className="font-bold text-indigo-300 text-sm">New</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <Clock size={16} />
                                        <span>{astrologer.experience_years || 5}+ Years</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <Users size={16} />
                                        <span>{astrologer.total_consultations || estimateConsultations(astrologer.user_id || 0, astrologer.experience_years || 5)}+ Consultations</span>
                                    </div>
                                </div>

                                {/* Languages */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                                    <span className="text-gray-400 text-sm">Languages:</span>
                                    {languagesArray.map((lang: string, i: number) => (
                                        <span key={i} className="bg-white/10 text-gray-200 px-3 py-1 rounded-full text-sm">
                                            {lang}
                                        </span>
                                    ))}
                                </div>

                                {/* Specialties */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    <span className="text-gray-400 text-sm">Expertise:</span>
                                    {specialtiesArray.map((spec: string, i: number) => (
                                        <span key={i} className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-200 px-3 py-1 rounded-full text-sm border border-pink-500/30">
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Action Card */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 min-w-[280px]">
                                <div className="text-center mb-4">
                                    <div className="text-sm text-gray-300 mb-1">Consultation Fee</div>
                                    <div className="text-3xl md:text-4xl text-white">
                                        ₹{astrologer.consultation_fee_per_min}
                                        <span className="text-lg font-normal text-gray-300">/min</span>
                                    </div>
                                </div>

                                {status === 'OFFLINE' ? (
                                    canKnock ? (
                                        <button
                                            onClick={handleNotify}
                                            disabled={notified}
                                            className="w-full bg-white/15 border border-white/30 text-white font-bold py-4 rounded-xl hover:bg-white/25 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-default"
                                        >
                                            <Bell size={20} />
                                            {notified ? "Knocked" : 'Knock'}
                                        </button>
                                    ) : (
                                        <div className="w-full text-center py-4 text-white/70 font-medium">
                                            Currently Offline
                                        </div>
                                    )
                                ) : (
                                    <button
                                        onClick={handleStartChat}
                                        className="w-full bg-gradient-to-r from-[#E91E63] to-[#FF5722] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <MessageCircle size={20} />
                                        {status === 'BUSY' ? 'Start Chat (Join Queue)' : 'Start Chat Now'}
                                    </button>
                                )}

                                {status === 'BUSY' && (
                                    <div className="mt-3 text-center text-xs text-amber-200">
                                        Astrologer is in another consultation — you'll be queued and notified when it's your turn.
                                    </div>
                                )}

                                {astrologer.availability_hours && (
                                    <div className="mt-4 text-center text-sm text-gray-300">
                                        <Calendar size={14} className="inline mr-1" />
                                        Available: {astrologer.availability_hours}
                                    </div>
                                )}

                                <button className="w-full mt-3 border border-white/30 text-white font-medium py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                    <Heart size={18} />
                                    Add to Favorites
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="container mx-auto px-6 py-5 md:py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-4 md:space-y-8">
                            {/* About Section — omitted entirely when the astrologer hasn't written a real bio,
                                rather than showing fabricated boilerplate attributed to them. */}
                            {astrologer.about_me && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-xl font-normal text-gray-900 mb-4 flex items-center gap-2">
                                        <Award className="text-[#E91E63]" size={24} />
                                        About Me
                                    </h2>
                                    <p className="text-gray-600 leading-relaxed">
                                        {astrologer.about_me}
                                    </p>
                                </div>
                            )}

                            {/* Expertise Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-normal text-gray-900 mb-4">
                                    Areas of Expertise
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {(specialtiesArray.length > 0 ? specialtiesArray : ['Vedic Astrology', 'Career Guidance', 'Marriage Compatibility', 'Health Predictions', 'Remedies', 'Horoscope Reading']).map((spec: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                                            <CheckCircle size={18} className="text-green-500" />
                                            <span className="text-gray-700 font-medium">{spec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Why Consult Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-normal text-gray-900 mb-4">Why Consult {displayName}?</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle size={20} className="text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-normal text-gray-900">Accurate Predictions</h3>
                                            <p className="text-gray-600 text-sm">Highly precise predictions based on detailed chart analysis</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Clock size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-normal text-gray-900">Timely Guidance</h3>
                                            <p className="text-gray-600 text-sm">Quick and responsive consultations when you need them</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <Heart size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-normal text-gray-900">Compassionate Approach</h3>
                                            <p className="text-gray-600 text-sm">Understanding and empathetic guidance for your concerns</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seeker Reviews */}
                            {reviews.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-xl font-normal text-gray-900 mb-4">What Seekers Say</h2>
                                    <div className="space-y-4">
                                        {reviews.map((review, idx) => (
                                            <div key={idx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-normal text-gray-900">{review.seeker_display_name}</span>
                                                    <div className="text-amber-500 text-sm" aria-label={`${review.rating} out of 5 stars`}>
                                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 text-sm italic">&ldquo;{review.comment}&rdquo;</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-normal text-gray-900 mb-4">Quick Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Experience</span>
                                        <span className="font-bold text-gray-900">{astrologer.experience_years || 5}+ Years</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Consultations</span>
                                        <span className="font-bold text-gray-900">{astrologer.total_consultations || estimateConsultations(astrologer.user_id || 0, astrologer.experience_years || 5)}+</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Rating</span>
                                        {Number(astrologer.rating_avg) > 0 ? (
                                            <div className="flex items-center gap-1">
                                                <Star size={16} fill="#FFD700" stroke="#FFD700" />
                                                <span className="font-bold text-gray-900">{Number(astrologer.rating_avg).toFixed(1)}</span>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-indigo-600">New</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Response Time</span>
                                        <span className="font-bold text-green-600">{'< 2 min'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Card */}
                            <div className="bg-gradient-to-br from-[#E91E63] to-[#FF5722] rounded-2xl p-6 text-white">
                                <h3 className="font-normal text-lg mb-2">Ready to get insights?</h3>
                                <p className="text-white/80 text-sm mb-4">
                                    {status === 'OFFLINE'
                                        ? (canKnock
                                            ? "This astrologer is offline. Get notified the moment they're back online."
                                            : "This astrologer is currently offline.")
                                        : 'Start your consultation now and get personalized guidance.'}
                                </p>
                                {status === 'OFFLINE' ? (
                                    canKnock && (
                                        <button
                                            onClick={handleNotify}
                                            disabled={notified}
                                            className="w-full bg-white text-[#E91E63] font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-default"
                                        >
                                            <Bell size={18} />
                                            {notified ? "Knocked" : 'Knock'}
                                        </button>
                                    )
                                ) : (
                                    <button
                                        onClick={handleStartChat}
                                        className="w-full bg-white text-[#E91E63] font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={18} />
                                        {status === 'BUSY' ? 'Join Queue' : 'Chat Now'}
                                        <ChevronRight size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />

            <ProfileCompletionModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onComplete={handleProfileComplete}
                initialProfile={seekerProfile}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
};

export default AstrologerProfile;
