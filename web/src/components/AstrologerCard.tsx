import React from 'react';
import type { Astrologer } from '../types';
import './AstrologerCard.css';

interface Props {
    astro: Astrologer;
    onChatClick: (astroId: number) => void;
}

const AstrologerCard: React.FC<Props> = ({ astro, onChatClick }) => {
    return (
        <div className="card astro-card">
            <div className="astro-main-row">
                <div className="astro-image-container">
                    <img
                        src={astro.profile_picture_url || `https://ui-avatars.com/api/?name=${astro.full_name}&background=random`}
                        alt={astro.full_name}
                        className="astro-img"
                    />
                    <span className={`status-badge ${astro.is_online ? 'online' : 'offline'}`}>
                        {astro.is_online ? 'Online' : 'Offline'}
                    </span>
                </div>

                <div className="astro-info">
                    <h3 className="astro-name">{astro.full_name}</h3>
                    <p className="astro-spec">{astro.specialties}</p>
                    <p className="astro-lang">{astro.languages}</p>
                    <p className="astro-exp">{astro.experience_years} Years Exp</p>
                </div>
            </div>

            <div className="astro-footer-row">
                <div className="astro-stats">
                    <span className="rating">★ {Number(astro.rating_avg).toFixed(1)}</span>
                    <span className="price">₹{Number(astro.consultation_fee_per_min)}/min</span>
                </div>

                <button
                    className="btn btn-primary chat-now-btn"
                    onClick={() => onChatClick(astro.id)}
                >
                    Chat
                </button>
            </div>
        </div>
    );
};

export default AstrologerCard;
