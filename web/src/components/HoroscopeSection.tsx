import React from 'react';
import { Link } from 'react-router-dom';
import './HoroscopeSection.css';

const zodiacSigns = [
    { name: 'Mesh', translation: 'Aries', dates: 'Apr 13 - May 14', slug: 'aries', element: 'Fire', glyph: '🐏' },
    { name: 'Vrishabh', translation: 'Taurus', dates: 'May 15 - Jun 14', slug: 'taurus', element: 'Earth', glyph: '🐂' },
    { name: 'Mithun', translation: 'Gemini', dates: 'Jun 15 - Jul 14', slug: 'gemini', element: 'Air', glyph: '👯' },
    { name: 'Kark', translation: 'Cancer', dates: 'Jul 15 - Aug 14', slug: 'cancer', element: 'Water', glyph: '🦀' },
    { name: 'Simha', translation: 'Leo', dates: 'Aug 15 - Sep 15', slug: 'leo', element: 'Fire', glyph: '🦁' },
    { name: 'Kanya', translation: 'Virgo', dates: 'Sep 16 - Oct 15', slug: 'virgo', element: 'Earth', glyph: '👧' },
    { name: 'Tula', translation: 'Libra', dates: 'Oct 16 - Nov 14', slug: 'libra', element: 'Air', glyph: '⚖️' },
    { name: 'Vrishchik', translation: 'Scorpio', dates: 'Nov 15 - Dec 14', slug: 'scorpio', element: 'Water', glyph: '🦂' },
    { name: 'Dhanu', translation: 'Sagittarius', dates: 'Dec 15 - Jan 13', slug: 'sagittarius', element: 'Fire', glyph: '🏹' },
    { name: 'Makar', translation: 'Capricorn', dates: 'Jan 14 - Feb 13', slug: 'capricorn', element: 'Earth', glyph: '🕷️' },
    { name: 'Kumbha', translation: 'Aquarius', dates: 'Feb 14 - Mar 13', slug: 'aquarius', element: 'Air', glyph: '🏺' },
    { name: 'Meen', translation: 'Pisces', dates: 'Mar 14 - Apr 12', slug: 'pisces', element: 'Water', glyph: '🐟' }
];

const getZodiacSVG = (glyph: string, name: string) => {
    return (
        <span className="zodiac-icon" role="img" aria-label={`${name} icon`}>
            {glyph}
        </span>
    );
};

const HoroscopeSection: React.FC = () => {
    return (
        <section className="horoscope-section py-24 relative overflow-hidden">


            {/* Background elements */}
            <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="horoscope-heading max-w-3xl mx-auto mb-16 text-center" data-aos="fade-up">
                    <span className="text-amber-500 font-semibold uppercase tracking-widest text-sm mb-4 block">Cosmic Forecast</span>
                    <h2 className="horoscope-title text-3xl md:text-4xl text-white mb-6">
                        Explore Your Daily <span className="text-amber-500">Horoscope</span>
                    </h2>
                    <p className="horoscope-description text-xl text-gray-400 leading-relaxed">
                        Discover what the stars have in store for you today. Select your zodiac sign for personalized guidance on love, career, and spiritual energy.
                    </p>
                </div>

                <div className="zodiac-grid" data-aos="fade-up" data-aos-delay="100">
                    {zodiacSigns.map((sign) => (
                        <Link to={`/services/horoscope/${sign.slug}`} key={sign.slug} className="zodiac-card">
                            {getZodiacSVG(sign.glyph, sign.name)}
                            <h3 className="zodiac-name">{sign.name}</h3>
                            <span className="zodiac-dates">{sign.dates}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HoroscopeSection;
