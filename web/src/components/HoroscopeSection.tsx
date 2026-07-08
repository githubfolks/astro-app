import React from 'react';
import { Link } from 'react-router-dom';
import './HoroscopeSection.css';

const zodiacSigns = [
    { name: 'Mesh', translation: 'Aries', dates: 'Mar 21 - Apr 19', slug: 'aries', element: 'Fire', symbol: '♈' },
    { name: 'Vrishabh', translation: 'Taurus', dates: 'Apr 20 - May 20', slug: 'taurus', element: 'Earth', symbol: '♉' },
    { name: 'Mithun', translation: 'Gemini', dates: 'May 21 - Jun 20', slug: 'gemini', element: 'Air', symbol: '♊' },
    { name: 'Kark', translation: 'Cancer', dates: 'Jun 21 - Jul 22', slug: 'cancer', element: 'Water', symbol: '♋' },
    { name: 'Simha', translation: 'Leo', dates: 'Jul 23 - Aug 22', slug: 'leo', element: 'Fire', symbol: '♌' },
    { name: 'Kanya', translation: 'Virgo', dates: 'Aug 23 - Sep 22', slug: 'virgo', element: 'Earth', symbol: '♍' },
    { name: 'Tula', translation: 'Libra', dates: 'Sep 23 - Oct 22', slug: 'libra', element: 'Air', symbol: '♎' },
    { name: 'Vrishchik', translation: 'Scorpio', dates: 'Oct 23 - Nov 21', slug: 'scorpio', element: 'Water', symbol: '♏' },
    { name: 'Dhanu', translation: 'Sagittarius', dates: 'Nov 22 - Dec 21', slug: 'sagittarius', element: 'Fire', symbol: '♐' },
    { name: 'Makar', translation: 'Capricorn', dates: 'Dec 22 - Jan 19', slug: 'capricorn', element: 'Earth', symbol: '♑' },
    { name: 'Kumbha', translation: 'Aquarius', dates: 'Jan 20 - Feb 18', slug: 'aquarius', element: 'Air', symbol: '♒' },
    { name: 'Meen', translation: 'Pisces', dates: 'Feb 19 - Mar 20', slug: 'pisces', element: 'Water', symbol: '♓' }
];

const getZodiacSVG = (symbol: string, name: string) => {
    return (
        <span className="zodiac-icon" role="img" aria-label={`${name} icon`}>
            {symbol}
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
                            {getZodiacSVG(sign.symbol, sign.name)}
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
