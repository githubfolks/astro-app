import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Gift, ArrowRight } from 'lucide-react';

const PromoTopBar: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const isDismissed = sessionStorage.getItem('promo_bar_dismissed');
        if (isDismissed === 'true') {
            setIsVisible(false);
        }
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('promo_bar_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 text-white px-3 py-1.5 text-xs md:text-sm font-medium relative z-50 shadow-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
                <div className="flex items-center justify-center gap-2 flex-1 text-center truncate">
                    <span className="hidden sm:inline-flex items-center gap-1 bg-white/20 border border-white/30 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <Gift className="w-3 h-3 text-yellow-300" /> Offer
                    </span>
                    <span className="truncate">
                        🎁 <strong className="font-semibold text-amber-100">First Consultation starting at ₹10/min</strong> + 5 Free AI Questions Daily!
                    </span>
                    <Link
                        to="/astrologers"
                        className="inline-flex items-center gap-1 bg-white text-amber-900 font-bold px-2.5 py-0.5 rounded-full text-[11px] hover:bg-amber-100 transition-colors shadow-sm shrink-0 ml-1"
                    >
                        Talk Now <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <button
                    onClick={dismiss}
                    aria-label="Close Announcement"
                    className="text-white/80 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default PromoTopBar;
