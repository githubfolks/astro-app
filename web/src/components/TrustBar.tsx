import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, MessageCircle, Star } from 'lucide-react';
import { api } from '../services/api';

interface TrustStats {
    verified_astrologers: number;
    total_consultations: number;
    total_reviews: number;
    average_rating: number;
}

const formatCount = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k+`;
    return `${n}`;
};

const TrustBar: React.FC = () => {
    const [stats, setStats] = useState<TrustStats | null>(null);

    useEffect(() => {
        let cancelled = false;
        api.cms.getTrustStats()
            .then((data) => { if (!cancelled) setStats(data); })
            .catch(() => { /* keep section hidden rather than show stale/placeholder numbers */ });
        return () => { cancelled = true; };
    }, []);

    // Structural trust items when live numbers are loading or zero
    const defaultPillars = [
        { icon: ShieldCheck, label: '4-Step Expert Screening', value: '100% Verified' },
        { icon: Users, label: 'Private & Confidential', value: '100% Secure' },
        { icon: Star, label: 'AI + Human Handoff', value: 'Instant Advice' },
        { icon: MessageCircle, label: 'Starting From', value: '₹10/min' },
    ];

    const hasLiveStats = stats && stats.verified_astrologers > 0;

    const items = hasLiveStats ? [
        { icon: ShieldCheck, label: 'Verified Astrologers', value: formatCount(stats.verified_astrologers) },
        ...(stats.total_consultations > 0
            ? [{ icon: Users, label: 'Consultations Completed', value: formatCount(stats.total_consultations) }]
            : []),
        ...(stats.total_reviews > 0
            ? [{ icon: Star, label: 'Average Rating', value: `${stats.average_rating.toFixed(1)}★` }]
            : []),
        ...(stats.total_reviews > 0
            ? [{ icon: MessageCircle, label: 'Reviews from Seekers', value: formatCount(stats.total_reviews) }]
            : []),
    ] : defaultPillars;

    return (
        <section className="trust-bar-section py-10 bg-indigo-950/95 border-y border-indigo-800/40">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <div key={item.label} className="flex flex-col items-center text-center gap-2">
                            <item.icon size={24} className="text-amber-400" />
                            <span className="text-2xl md:text-3xl text-white font-bold">{item.value}</span>
                            <span className="text-xs md:text-sm text-indigo-200/70 uppercase tracking-wide font-medium">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustBar;
