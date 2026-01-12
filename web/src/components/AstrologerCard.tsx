import React from 'react';
import { Link } from 'react-router-dom';
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
                <Link to={`/astrologer/${astro.id}`} className="astro-image-container" style={{ textDecoration: 'none' }}>
                    <img
                        src={astro.profile_picture_url || `https://ui-avatars.com/api/?name=${astro.full_name}&background=random`}
                        alt={astro.full_name}
                        className="astro-img"
                    />
                    <span className={`status-badge ${astro.is_online ? 'online' : 'offline'}`}>
                        {astro.is_online ? 'Online' : 'Offline'}
                    </span>
                </Link>

                <div className="astro-info">
                    <Link to={`/astrologer/${astro.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className="astro-name" style={{ cursor: 'pointer' }}>{astro.full_name}</h3>
                    </Link>
                    <p className="astro-spec">{astro.specialties}</p>
                    <p className="astro-lang">{astro.languages}</p>
                    <p className="astro-exp">{astro.experience_years} Years Exp</p>
                    {/* Availability Hours Display */}
                    {astro.availability_hours && (
                        <p className="astro-hours" style={{
                            fontSize: '11px',
                            color: '#2563eb',
                            backgroundColor: '#eff6ff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            marginTop: '6px',
                            display: 'inline-block'
                        }}>
                            Avail: {astro.availability_hours}
                        </p>
                    )}
                </div>
            </div>

            <div className="astro-footer-row">
                <div className="astro-stats">
                    <span className="rating">★ {Number(astro.rating_avg).toFixed(1)}</span>
                    <span className="price">₹{Number(astro.consultation_fee_per_min)}/min</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link
                        to={`/astrologer/${astro.id}`}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            textDecoration: 'none'
                        }}
                    >
                        View Profile
                    </Link>
                    {astro.is_online ? (
                        <button
                            className="btn btn-primary chat-now-btn"
                            onClick={() => onChatClick(astro.id)}
                        >
                            Chat
                        </button>
                    ) : (
                        <span style={{
                            padding: '8px 16px',
                            backgroundColor: '#e5e7eb',
                            color: '#6b7280',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            Offline
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AstrologerCard;
