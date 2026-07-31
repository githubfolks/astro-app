import React from 'react';
import { Link } from 'react-router-dom';

interface ConnectExpertCTAProps {
    variant?: 'light' | 'dark';
    text?: string;
}

const ConnectExpertCTA: React.FC<ConnectExpertCTAProps> = ({
    variant = 'light',
    text = 'Want a deeper, personalized reading? Talk it through with a real expert.',
}) => {
    const isDark = variant === 'dark';
    return (
        <section className={`connect-expert-cta text-center py-16 px-4 ${isDark ? '' : 'border-t border-gray-100'}`}>
            <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{text}</p>
            <Link
                to="/astrologers"
                className="inline-block bg-amber-500 text-indigo-950 px-10 py-4 rounded-full font-normal text-lg shadow-xl shadow-amber-500/10 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all"
            >
                Connect with Expert
            </Link>
        </section>
    );
};

export default ConnectExpertCTA;
