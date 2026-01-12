import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Heart, Briefcase, Home, Hash, Scroll, Star, LayoutGrid } from 'lucide-react';
import AstrologerCard from './AstrologerCard';
import type { Astrologer } from '../types';
import LoginModal from './LoginModal';
import { useAuth } from '../context/AuthContext';
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
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleChatClick = (astroId: number) => {
        if (isAuthenticated) {
            navigate(`/chat/new/${astroId}`);
        } else {
            setPendingChatAstroId(astroId);
            setIsLoginModalOpen(true);
        }
    };

    const handleLoginSuccess = () => {
        if (pendingChatAstroId) {
            navigate(`/chat/new/${pendingChatAstroId}`);
        }
    };

    useEffect(() => {
        fetch('http://localhost:8000/users?skip=0&limit=10')
            .then(res => res.json())
            .then(data => {
                if (data.length === 0) throw new Error("No data");
                const astros = data.filter((u: any) => u.role === "ASTROLOGER").map((u: any) => ({
                    id: u.id,
                    full_name: u.astrologer_profile?.full_name || "Astrologer",
                    profile_picture_url: u.astrologer_profile?.profile_picture_url,
                    specialties: u.astrologer_profile?.specialties || "Vedic",
                    languages: u.astrologer_profile?.languages || "English",
                    experience_years: u.astrologer_profile?.experience_years || 5,
                    consultation_fee_per_min: u.astrologer_profile?.consultation_fee_per_min || 10,
                    rating_avg: u.astrologer_profile?.rating_avg || 5.0,
                    is_online: u.astrologer_profile?.is_online || false
                }));
                setAstrologers(astros);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch astrologers, using fallback data", err);
                const mockData: Astrologer[] = [
                    { id: 101, full_name: "Mystic Luna", specialties: "Tarot, Psychic", languages: "English", experience_years: 8, consultation_fee_per_min: 15, rating_avg: 4.8, is_online: true },
                    { id: 102, full_name: "Guru Dev", specialties: "Vedic", languages: "Hindi, Sanskrit", experience_years: 15, consultation_fee_per_min: 20, rating_avg: 4.9, is_online: true },
                    { id: 103, full_name: "Astro Bella", specialties: "Numerology", languages: "French, English", experience_years: 5, consultation_fee_per_min: 12, rating_avg: 4.5, is_online: false },
                    { id: 104, full_name: "Pandit Ji", specialties: "Vastu", languages: "Hindi", experience_years: 25, consultation_fee_per_min: 25, rating_avg: 5.0, is_online: true },
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
        { name: 'Tarot', icon: <Star size={16} /> },
        { name: 'Numerology', icon: <Hash size={16} /> },
        { name: 'Vastu', icon: <Home size={16} /> },
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
        </section>
    );
};

export default AstrologerList;
