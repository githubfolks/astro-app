import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
    Star,
    MessageCircle,
    Clock,
    Award,
    CheckCircle,
    Calendar,
    Users,
    ChevronRight,
    Heart
} from 'lucide-react';

const AstrologerProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const [astrologer, setAstrologer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [seekerProfile, setSeekerProfile] = useState<any>(null);

    useEffect(() => {
        // Fetch astrologer details
        if (id) {
            api.astrologers.getOne(id)
                .then(data => {
                    setAstrologer(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch astrologer', err);
                    setLoading(false);
                });
        }
    }, [id]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'SEEKER') {
            api.seekers.getProfile()
                .then(setSeekerProfile)
                .catch(console.error);
        }
    }, [isAuthenticated, user]);

    const isProfileComplete = (profile: any) => {
        return profile?.date_of_birth && profile?.time_of_birth && profile?.place_of_birth && profile?.gender;
    };

    const handleStartChat = () => {
        if (!isAuthenticated) {
            setIsLoginModalOpen(true);
            return;
        }

        if (!isProfileComplete(seekerProfile)) {
            setIsProfileModalOpen(true);
            return;
        }

        navigate(`/chat/new/${id}`);
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

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white py-12">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                            {/* Profile Image */}
                            <div className="relative">
                                <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl bg-gradient-to-br from-purple-400 to-pink-500">
                                    {astrologer.profile_picture_url ? (
                                        <img
                                            src={astrologer.profile_picture_url}
                                            alt={astrologer.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-white">
                                            {astrologer.full_name?.[0]?.toUpperCase() || 'A'}
                                        </div>
                                    )}
                                </div>
                                {astrologer.is_online ? (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        Online
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
                                <h1 className="text-3xl md:text-4xl font-bold mb-3">{astrologer.full_name}</h1>

                                {/* Rating & Stats */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                                    <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                                        <Star size={18} fill="#FFD700" stroke="#FFD700" />
                                        <span className="font-bold text-yellow-400">{Number(astrologer.rating_avg || 5).toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <Clock size={16} />
                                        <span>{astrologer.experience_years || 5}+ Years</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <Users size={16} />
                                        <span>{astrologer.total_consultations || 500}+ Consultations</span>
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
                                    <div className="text-4xl font-bold text-white">
                                        ₹{astrologer.consultation_fee_per_min}
                                        <span className="text-lg font-normal text-gray-300">/min</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartChat}
                                    className="w-full bg-gradient-to-r from-[#E91E63] to-[#FF5722] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <MessageCircle size={20} />
                                    Start Chat Now
                                </button>

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
                <div className="container mx-auto px-6 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* About Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Award className="text-[#E91E63]" size={24} />
                                    About Me
                                </h2>
                                <p className="text-gray-600 leading-relaxed">
                                    {astrologer.about_me || `${astrologer.full_name} is a highly experienced astrologer with ${astrologer.experience_years || 5}+ years of practice in Vedic astrology. Specializing in ${specialtiesArray.join(', ') || 'various aspects of astrology'}, they provide accurate predictions and practical remedies for life's challenges. With a deep understanding of planetary influences and their effects on human life, they offer guidance on career, relationships, health, and spiritual growth.`}
                                </p>
                            </div>

                            {/* Expertise Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
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
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Why Consult {astrologer.full_name}?</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle size={20} className="text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Accurate Predictions</h3>
                                            <p className="text-gray-600 text-sm">Highly precise predictions based on detailed chart analysis</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Clock size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Timely Guidance</h3>
                                            <p className="text-gray-600 text-sm">Quick and responsive consultations when you need them</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <Heart size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Compassionate Approach</h3>
                                            <p className="text-gray-600 text-sm">Understanding and empathetic guidance for your concerns</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Experience</span>
                                        <span className="font-bold text-gray-900">{astrologer.experience_years || 5}+ Years</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Consultations</span>
                                        <span className="font-bold text-gray-900">{astrologer.total_consultations || 500}+</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Rating</span>
                                        <div className="flex items-center gap-1">
                                            <Star size={16} fill="#FFD700" stroke="#FFD700" />
                                            <span className="font-bold text-gray-900">{Number(astrologer.rating_avg || 5).toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Response Time</span>
                                        <span className="font-bold text-green-600">{'< 2 min'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Card */}
                            <div className="bg-gradient-to-br from-[#E91E63] to-[#FF5722] rounded-2xl p-6 text-white">
                                <h3 className="font-bold text-lg mb-2">Ready to get insights?</h3>
                                <p className="text-white/80 text-sm mb-4">Start your consultation now and get personalized guidance.</p>
                                <button
                                    onClick={handleStartChat}
                                    className="w-full bg-white text-[#E91E63] font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <MessageCircle size={18} />
                                    Chat Now
                                    <ChevronRight size={18} />
                                </button>
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
        </div>
    );
};

export default AstrologerProfile;
