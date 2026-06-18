import React from 'react';
import { Link } from 'react-router-dom';
import './HoroscopeSection.css';

const zodiacSigns = [
    { name: 'Mesh', translation: 'Aries', dates: 'Mar 21 - Apr 19', slug: 'aries', element: 'Fire' },
    { name: 'Vrishabh', translation: 'Taurus', dates: 'Apr 20 - May 20', slug: 'taurus', element: 'Earth' },
    { name: 'Mithun', translation: 'Gemini', dates: 'May 21 - Jun 20', slug: 'gemini', element: 'Air' },
    { name: 'Kark', translation: 'Cancer', dates: 'Jun 21 - Jul 22', slug: 'cancer', element: 'Water' },
    { name: 'Simha', translation: 'Leo', dates: 'Jul 23 - Aug 22', slug: 'leo', element: 'Fire' },
    { name: 'Kanya', translation: 'Virgo', dates: 'Aug 23 - Sep 22', slug: 'virgo', element: 'Earth' },
    { name: 'Tula', translation: 'Libra', dates: 'Sep 23 - Oct 22', slug: 'libra', element: 'Air' },
    { name: 'Vrishchik', translation: 'Scorpio', dates: 'Oct 23 - Nov 21', slug: 'scorpio', element: 'Water' },
    { name: 'Dhanu', translation: 'Sagittarius', dates: 'Nov 22 - Dec 21', slug: 'sagittarius', element: 'Fire' },
    { name: 'Makar', translation: 'Capricorn', dates: 'Dec 22 - Jan 19', slug: 'capricorn', element: 'Earth' },
    { name: 'Kumbha', translation: 'Aquarius', dates: 'Jan 20 - Feb 18', slug: 'aquarius', element: 'Air' },
    { name: 'Meen', translation: 'Pisces', dates: 'Feb 19 - Mar 20', slug: 'pisces', element: 'Water' }
];

const getZodiacSVG = (slug: string) => {
    switch (slug) {
        case 'aries':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Mesh / Ram head & horns */}
                    <path d="M12 19l-2.5-6h5L12 19z" />
                    <path d="M9.5 13c-2-3-5-2-5 1.5s2 3.5 4.5 1" />
                    <path d="M14.5 13c2-3 5-2 5 1.5s-2 3.5-4.5 1" />
                </svg>
            );
        case 'taurus':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Vrishabh / Bull head & sharp horns */}
                    <path d="M8 12v3a4 4 0 0 0 8 0v-3H8z" />
                    <path d="M8 12c-1-3-3-5-5-5 2 4 2 8 5 8" />
                    <path d="M16 12c1-3 3-5 5-5-2 4-2 8-5 8" />
                </svg>
            );
        case 'gemini':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Mithun / Twins side-by-side */}
                    <circle cx="8" cy="6.5" r="2" />
                    <path d="M8 8.5v8M5 11h6M6 21l2-4.5 2 4.5" />
                    <circle cx="16" cy="6.5" r="2" />
                    <path d="M16 8.5v8M13 11h6M14 21l2-4.5 2 4.5" />
                </svg>
            );
        case 'cancer':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Kark / Crab */}
                    <ellipse cx="12" cy="14" rx="3.5" ry="2.5" />
                    <path d="M9.5 11.5c-1-2-3-2.5-4.5-1s.5 4 2.5 3M14.5 11.5c1-2 3-2.5 4.5-1s-.5 4-2.5 3" />
                    <path d="M9.5 11.5v-2M14.5 11.5v-2" />
                    <path d="M8.5 15.5l-2.5 1M8.5 16.5l-2 2M15.5 15.5l2.5 1M15.5 16.5l2 2" />
                </svg>
            );
        case 'leo':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Simha / Lion profile mane */}
                    <path d="M12 9l-1.5 3h3L12 9z" />
                    <path d="M10.5 12c0 1.5 1.5 2.5 1.5 2.5s1.5-1 1.5-2.5" />
                    <path d="M12 4c-3.8 0-7 3.2-7 7 0 3.5 2.5 6 3.5 7h7c1 0 3.5-2.5 3.5-7 0-3.8-3.2-7-7-7z" />
                    <path d="M12 2v2M5 11H3M19 11h2" />
                </svg>
            );
        case 'virgo':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Kanya / Maiden face profile & hair */}
                    <path d="M8 14c1-1 2-2.5 2-5S8.5 5 12 5s5 2 5 5-2.5 7.5-5 9.5" />
                    <circle cx="17" cy="8.5" r="1" />
                    <path d="M17 7.5c.5-1.5 2-1.5 2-1.5s-.5 1.5-2 1.5M18.5 9c1.5 0 2 1 2 1s-1.5 0-2-1" />
                    <path d="M10 10.5c0 3.5 2 6 5 6" />
                </svg>
            );
        case 'libra':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Tula / Mechanical scale balance */}
                    <path d="M4 20h16M12 20V5" />
                    <path d="M6 8h12" />
                    <path d="M6 8l-2 6h4L6 8zm0 6v3" />
                    <path d="M18 8l-2 6h4L18 8zm0 6v3" />
                </svg>
            );
        case 'scorpio':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Vrishchik / Scorpion body & curved sting tail */}
                    <rect x="10" y="8" width="4" height="6" rx="2" />
                    <path d="M10 10c-1.5-1.5-3.5-1-4.5 1s1.5 3 2.5 2M14 10c1.5-1.5 3.5-1 4.5 1s-1.5 3-2.5 2" />
                    <path d="M12 14c0 2.5-1 4.5 1 5.5s3-1 2.5-3l.5-1" />
                    <path d="M9 12H7M9 14H7M15 12h2M15 14h2" />
                </svg>
            );
        case 'sagittarius':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Dhanu / Bow & arrow */}
                    <path d="M6 18L18 6" />
                    <path d="M6 18c-3-9 3-15 12-12m-12 12c9 3 15-3 12-12" />
                    <path d="M8 16l11-11m0 0h-5m5 0v5" />
                </svg>
            );
        case 'capricorn':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Makar / Sea-Goat face & horned tail */}
                    <path d="M6 14h6l4-4v6H6z" />
                    <circle cx="11" cy="12" r="0.8" fill="currentColor" />
                    <path d="M12 10c1-3 3-4.5 5-4.5-1 2.5-1 5-3 6" />
                    <path d="M16 14c1 2 2.5 3 4.5 2.5l-2-2.5 2-2.5c-2-.5-3.5.5-4.5 2.5z" />
                </svg>
            );
        case 'aquarius':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Kumbha / Water pitcher pot pouring waves */}
                    <path d="M11 6c-2 0-3 1.5-3 3.5V11c-2 1-3 3-3 5.5s2 4.5 4.5 4.5h2.5" />
                    <path d="M12 6c2 0 3 1.5 3 3.5V11c2 1 3 3 3 5.5s-2 4.5-4.5 4.5H12" />
                    <path d="M10 6h4V4h-4v2z" />
                    <path d="M7 6c-1-1.5-3-1.5-4 0s0 3.5 3 3.5" />
                    <path d="M6 8c-1-1-2-1-2.5 0s.5 2.5 2.5 2" />
                </svg>
            );
        case 'pisces':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="zodiac-svg">
                    {/* Meen / Two fish swimming in circular flow */}
                    <path d="M6 8c3-.5 6 1.5 7.5 4L11 10.5 13 8.5C11.5 7.5 8.5 7.5 6 8z" />
                    <path d="M6 8l-2.5-2 1 3z" />
                    <path d="M18 16c-3 .5-6-1.5-7.5-4l2.5 1.5-2 2c1.5 1 4.5 1 7.5 0z" />
                    <path d="M18 16l2.5 2-1-3z" />
                    <path d="M9.5 10c1 1.5 2.5 2.5 4.5 2.5" strokeDasharray="1.5 1.5" />
                </svg>
            );
        default:
            return null;
    }
};

const HoroscopeSection: React.FC = () => {
    return (
        <section className="horoscope-section py-24 relative overflow-hidden">
            {/* SVG Gradient Defs */}
            <svg style={{ width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFE066" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Background elements */}
            <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto mb-16 text-center" data-aos="fade-up">
                    <span className="text-amber-500 font-semibold uppercase tracking-widest text-sm mb-4 block">Cosmic Forecast</span>
                    <h2 className="text-3xl md:text-4xl text-white mb-6">
                        Explore Your Daily <span className="text-amber-500">Horoscope</span>
                    </h2>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        Discover what the stars have in store for you today. Select your zodiac sign for personalized guidance on love, career, and spiritual energy.
                    </p>
                </div>

                <div className="zodiac-grid" data-aos="fade-up" data-aos-delay="100">
                    {zodiacSigns.map((sign) => (
                        <Link to={`/horoscope/${sign.slug}`} key={sign.slug} className="zodiac-card">
                            {getZodiacSVG(sign.slug)}
                            <h3 className="zodiac-name">{sign.name}</h3>
                            <span className="zodiac-translation">{sign.translation}</span>
                            <span className="zodiac-dates">{sign.dates}</span>
                            <span className={`zodiac-element ${sign.element.toLowerCase()}`}>
                                {sign.element}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HoroscopeSection;
