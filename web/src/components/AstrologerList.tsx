import React, { useState } from 'react';
import { Search as SearchIcon, Heart, Briefcase, Scroll, LayoutGrid } from 'lucide-react';
import AstrologerCard from './AstrologerCard';
import type { Astrologer } from '../types';
import './AstrologerList.css';

// Static data for the landing page only branch
const STATIC_ASTROLOGERS: Astrologer[] = [
    {
        id: 1,
        full_name: "Dr. Aarti Sharma",
        specialties: "Vedic, Numerology",
        languages: "Hindi, English",
        experience_years: 15,
        consultation_fee_per_min: 25,
        rating_avg: 4.9,
        is_online: true,
        profile_picture_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarti"
    },
    {
        id: 2,
        full_name: "Acharya Vikram",
        specialties: "Vastu, Palmistry",
        languages: "Hindi, Sanskrit",
        experience_years: 20,
        consultation_fee_per_min: 30,
        rating_avg: 5.0,
        is_online: true,
        profile_picture_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram"
    },
    {
        id: 3,
        full_name: "Sonia Williams",
        specialties: "Tarot, Psychic",
        languages: "English",
        experience_years: 8,
        consultation_fee_per_min: 20,
        rating_avg: 4.7,
        is_online: true,
        profile_picture_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sonia"
    }
];

interface AstrologerListProps {
    limit?: number;
    topRankingOnly?: boolean;
    showFilters?: boolean;
}

const AstrologerList: React.FC<AstrologerListProps> = ({ limit, showFilters = true }) => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const handleChatClick = () => {
        alert("Aadikarta services are launching soon! This preview shows our expert panel.");
    };

    const categories = [
        { name: 'All', icon: <LayoutGrid size={16} /> },
        { name: 'Vedic', icon: <Scroll size={16} /> },
        { name: 'Love', icon: <Heart size={16} /> },
        { name: 'Career', icon: <Briefcase size={16} /> }
    ];

    // Client-side filtering
    const filteredAstrologers = STATIC_ASTROLOGERS.filter(astro => {
        const matchesCategory = selectedCategory === 'All' || 
            (astro.specialties && astro.specialties.includes(selectedCategory));
        const matchesSearch = astro.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (astro.languages && astro.languages.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (astro.specialties && astro.specialties.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const displayAstrologers = limit ? filteredAstrologers.slice(0, limit) : filteredAstrologers;

    return (
        <section className="astrologer-section">
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <h2 className="section-title">Chat with Expert Astrologers</h2>
                    <p className="section-description">Consult hand-picked celestial experts for personalized guidance on life, career, and relationships.</p>
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
                        displayAstrologers.map((astro, index) => (
                            <div key={astro.id} data-aos="fade-up" data-aos-delay={(index % 4) * 100}>
                                <AstrologerCard
                                    astro={astro}
                                    onChatClick={handleChatClick}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="no-results">No astrologers found matching your criteria.</div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default AstrologerList;
