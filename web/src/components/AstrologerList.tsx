import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Heart, Briefcase, Scroll, LayoutGrid } from 'lucide-react';
import AstrologerCard from './AstrologerCard';
import type { Astrologer } from '../types';
import LoginModal from './LoginModal';
import ProfileCompletionModal from './ProfileCompletionModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './AstrologerList.css';

interface AstrologerListProps {
    limit?: number;
    topRankingOnly?: boolean;
    showFilters?: boolean;
}

const AstrologerList: React.FC<AstrologerListProps> = ({ limit, topRankingOnly = false, showFilters = true }) => {
    const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [pendingChatAstroId, setPendingChatAstroId] = useState<number | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [seekerProfile, setSeekerProfile] = useState<any>(null);
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    // Fetch seeker profile when authenticated
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

    const handleChatClick = (astroId: number) => {
        if (!isAuthenticated) {
            setPendingChatAstroId(astroId);
            setIsLoginModalOpen(true);
            return;
        }

        // Check if profile is complete
        if (!isProfileComplete(seekerProfile)) {
            setPendingChatAstroId(astroId);
            setIsProfileModalOpen(true);
            return;
        }

        navigate(`/chat/new/${astroId}`);
    };

    const handleProfileComplete = () => {
        setIsProfileModalOpen(false);
        if (pendingChatAstroId) {
            navigate(`/chat/new/${pendingChatAstroId}`);
        }
    };

    const handleLoginSuccess = () => {
        // After login, refetch profile and check if complete
        api.seekers.getProfile()
            .then((profile) => {
                setSeekerProfile(profile);
                if (!isProfileComplete(profile) && pendingChatAstroId) {
                    setIsProfileModalOpen(true);
                } else if (pendingChatAstroId) {
                    navigate(`/chat/new/${pendingChatAstroId}`);
                }
            })
            .catch(console.error);
    };

    useEffect(() => {
        api.astrologers.list(0, 10)
            .then(data => {
                if (!Array.isArray(data)) throw new Error("Invalid response format");

                // Map AstrologerProfile array to Astrologer type
                const astros = data.map((profile: any) => ({
                    id: profile.user_id,
                    full_name: profile.full_name || "Astrologer",
                    profile_picture_url: profile.profile_picture_url,
                    specialties: profile.specialties || "Vedic",
                    languages: profile.languages || "English",
                    experience_years: profile.experience_years || 5,
                    consultation_fee_per_min: profile.consultation_fee_per_min || 10,
                    rating_avg: profile.rating_avg || 5.0,
                    is_online: profile.is_online || false,
                    availability_hours: profile.availability_hours || null
                }));
                setAstrologers(astros);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch astrologers, using fallback data", err);
                const mockData: Astrologer[] = [
                    { id: 102, full_name: "Guru Dev", specialties: "Vedic", languages: "Hindi, Sanskrit", experience_years: 15, consultation_fee_per_min: 20, rating_avg: 4.9, is_online: true },
                    { id: 105, full_name: "Cosmic Ray", specialties: "Nadi", languages: "Tamil", experience_years: 12, consultation_fee_per_min: 18, rating_avg: 4.7, is_online: false },
                ];
                setAstrologers(mockData);
                setLoading(false);
            });
    }, []);

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { name: 'All', icon: <LayoutGrid size={16} /> },
        { name: 'Vedic', icon: <Scroll size={16} /> },
        { name: 'Love', icon: <Heart size={16} /> },
        { name: 'Career', icon: <Briefcase size={16} /> }
    ];

    const filteredAstrologers = astrologers.filter(astro => {
        const matchesCategory = selectedCategory === 'All' ||
            (astro.specialties && astro.specialties.includes(selectedCategory));
        const matchesSearch = astro.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (astro.languages && astro.languages.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (astro.specialties && astro.specialties.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    // Sort by rating if topRankingOnly is true
    const sortedAstrologers = topRankingOnly
        ? [...filteredAstrologers].sort((a, b) => b.rating_avg - a.rating_avg)
        : filteredAstrologers;

    // Apply limit if provided
    const displayAstrologers = limit ? sortedAstrologers.slice(0, limit) : sortedAstrologers;

    if (loading) return <div className="loading">Loading Astrologers...</div>;

    return (
        <section className="astrologer-section">
            <div className="container">
                <div className="section-header">
                    <h2>Chat with Astrologer</h2>
                    <p>Consult expert astrologers for guidance on life, career, and relationships.</p>
                </div>

                {showFilters && (
                    <div className="filters-container">
                        <div className="search-box">
                            <SearchIcon size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="category-filters">
                            {categories.map(cat => (
                                <button
                                    key={cat.name}
                                    className={`filter-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat.name)}
                                >
                                    {cat.icon}
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="astro-grid">
                    {displayAstrologers.length > 0 ? (
                        displayAstrologers.map(astro => (
                            <AstrologerCard
                                key={astro.id}
                                astro={astro}
                                onChatClick={handleChatClick}
                            />
                        ))
                    ) : (
                        <div className="no-results">No astrologers found matching your criteria.</div>
                    )}
                </div>
            </div>

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
        </section>
    );
};

export default AstrologerList;
