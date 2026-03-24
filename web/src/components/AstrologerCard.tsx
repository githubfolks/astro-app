import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Languages, Award, Clock } from 'lucide-react';
import type { Astrologer } from '../types';
import { resolveImageUrl } from '../utils/url';
import './AstrologerCard.css';

interface Props {
    astro: Astrologer;
    onChatClick: (astroId: number) => void;
}

const AstrologerCard: React.FC<Props> = ({ astro, onChatClick }) => {
    return (
        <div className="card astro-card">
            <div className="astro-main-row">
                <Link to={`/astrologer/${astro.id}`} className="astro-image-container">
                    <img
                        src={resolveImageUrl(astro.profile_picture_url, astro.full_name)}
                        alt={astro.full_name}
                        className="astro-img"
                        width="84"
                        height="84"
                        loading="lazy"
                    />
                    <span className={`status-badge ${astro.is_online ? 'online' : 'offline'}`}>
                        {astro.is_online ? 'Online' : 'Offline'}
                    </span>
                </Link>

                <div className="astro-info">
                    <p className="astro-spec">{astro.specialties}</p>
                    <Link to={`/astrologer/${astro.id}`} style={{ textDecoration: 'none' }}>
                        <h3 className="astro-name">{astro.full_name}</h3>
                    </Link>
                    <div className="astro-lang">
                        <Languages size={14} />
                        <span>{astro.languages}</span>
                    </div>
                    <div className="astro-exp">
                        <Award size={14} />
                        <span>{astro.experience_years} Years Exp</span>
                    </div>
                    {astro.availability_hours && (
                        <div className="astro-hours flex items-center gap-1.5 mt-2 bg-indigo-50/50 text-indigo-600 px-2 py-1 rounded-md text-[10px] font-bold inline-flex">
                            <Clock size={12} />
                            <span>{astro.availability_hours}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="astro-footer-row">
                <div className="astro-stats">
                    <div className="rating">
                        <Star size={16} fill="currentColor" />
                        <span>{Number(astro.rating_avg).toFixed(1)}</span>
                    </div>
                    <span className="price">₹{Number(astro.consultation_fee_per_min)}/min</span>
                </div>

                <div className="action-buttons">
                    <Link
                        to={`/astrologer/${astro.id}`}
                        className="view-profile-link"
                    >
                        Profile
                    </Link>
                    {astro.is_online ? (
                        <button
                            className="chat-now-btn"
                            onClick={() => onChatClick(astro.id)}
                        >
                            Chat
                        </button>
                    ) : (
                        <span className="offline-badge">
                            Offline
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AstrologerCard;
