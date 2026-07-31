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
                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
            >
                Connect with Expert
            </Link>
        </section>
    );
};

export default ConnectExpertCTA;
