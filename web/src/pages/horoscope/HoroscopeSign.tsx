import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { api } from '../../services/api';
import './HoroscopeSign.css';

interface SignData {
    name: string;
    hindi: string;
    symbol: string;
    glyph: string;
    dates: string;
    element: string;
    ruling_planet: string;
    quality: string;
    traits: string[];
    strengths: string;
    challenges: string;
    lucky_color: string;
    lucky_number: string;
    compatible: string;
    desc: string;
}

const SIGNS: Record<string, SignData> = {
    aries: {
        name: 'Aries', hindi: 'मेष', symbol: '♈', glyph: '🐏',
        dates: 'March 21 – April 19',
        element: 'Fire', ruling_planet: 'Mars', quality: 'Cardinal',
        traits: ['Bold', 'Energetic', 'Pioneering', 'Competitive', 'Direct'],
        strengths: 'Natural leadership, courage, enthusiasm, and an unstoppable drive to initiate.',
        challenges: 'Impatience, impulsiveness, and a tendency to start things without finishing them.',
        lucky_color: 'Red', lucky_number: '9', compatible: 'Leo, Sagittarius, Gemini',
        desc: 'Aries is the first sign of the zodiac, representing new beginnings and raw ambition. Ruled by Mars — the planet of action — Aries natives are fearless trailblazers who charge ahead where others hesitate.',
    },
    taurus: {
        name: 'Taurus', hindi: 'वृषभ', symbol: '♉', glyph: '🐂',
        dates: 'April 20 – May 20',
        element: 'Earth', ruling_planet: 'Venus', quality: 'Fixed',
        traits: ['Reliable', 'Patient', 'Sensual', 'Determined', 'Practical'],
        strengths: 'Rock-solid reliability, financial acumen, sensory appreciation, and deep loyalty.',
        challenges: 'Stubbornness, resistance to change, and over-attachment to material comfort.',
        lucky_color: 'Green', lucky_number: '6', compatible: 'Virgo, Capricorn, Cancer',
        desc: 'Taurus is ruled by Venus and embodies earthly pleasures — comfort, beauty, and stability. Taurus natives build lasting wealth and relationships through patient, steady effort.',
    },
    gemini: {
        name: 'Gemini', hindi: 'मिथुन', symbol: '♊', glyph: '👯',
        dates: 'May 21 – June 20',
        element: 'Air', ruling_planet: 'Mercury', quality: 'Mutable',
        traits: ['Witty', 'Versatile', 'Curious', 'Communicative', 'Adaptable'],
        strengths: 'Quick intellect, outstanding communication, social agility, and creative thinking.',
        challenges: 'Inconsistency, superficiality, and difficulty committing to one path.',
        lucky_color: 'Yellow', lucky_number: '5', compatible: 'Libra, Aquarius, Aries',
        desc: 'Ruled by Mercury — planet of the mind — Gemini is the ultimate communicator. Twins of the zodiac, Geminis are multifaceted, quick-witted, and endlessly curious about the world around them.',
    },
    cancer: {
        name: 'Cancer', hindi: 'कर्क', symbol: '♋', glyph: '🦀',
        dates: 'June 21 – July 22',
        element: 'Water', ruling_planet: 'Moon', quality: 'Cardinal',
        traits: ['Nurturing', 'Intuitive', 'Protective', 'Emotional', 'Loyal'],
        strengths: 'Deep empathy, powerful intuition, fierce loyalty, and the ability to create home and belonging.',
        challenges: 'Moodiness, clinginess, over-sensitivity, and withdrawing into a shell when hurt.',
        lucky_color: 'Silver', lucky_number: '2', compatible: 'Scorpio, Pisces, Taurus',
        desc: 'Cancer is ruled by the Moon, making it the most emotionally attuned sign. Cancerians are fierce protectors of family and loved ones, guided by deep intuition and an unwavering need to nurture.',
    },
    leo: {
        name: 'Leo', hindi: 'सिंह', symbol: '♌', glyph: '🦁',
        dates: 'July 23 – August 22',
        element: 'Fire', ruling_planet: 'Sun', quality: 'Fixed',
        traits: ['Charismatic', 'Generous', 'Confident', 'Creative', 'Warm-hearted'],
        strengths: 'Natural magnetism, generous heart, creative brilliance, and unshakeable confidence.',
        challenges: 'Pride, need for admiration, stubbornness, and dominating tendencies.',
        lucky_color: 'Gold', lucky_number: '1', compatible: 'Aries, Sagittarius, Libra',
        desc: 'Ruled by the Sun — source of all light — Leo shines with natural authority and warmth. Leos are born leaders who command attention and inspire others with their magnificent creativity.',
    },
    virgo: {
        name: 'Virgo', hindi: 'कन्या', symbol: '♍', glyph: '🌾',
        dates: 'August 23 – September 22',
        element: 'Earth', ruling_planet: 'Mercury', quality: 'Mutable',
        traits: ['Analytical', 'Meticulous', 'Helpful', 'Reliable', 'Modest'],
        strengths: 'Unmatched analytical skills, attention to detail, strong work ethic, and deep desire to serve.',
        challenges: 'Perfectionism, overcritical nature, excessive worry, and self-doubt.',
        lucky_color: 'Navy Blue', lucky_number: '5', compatible: 'Taurus, Capricorn, Scorpio',
        desc: 'Virgo is the master craftsperson of the zodiac — methodical, precise, and always striving for improvement. Ruled by Mercury, Virgos apply sharp intellect to practical problems and excel as healers and analysts.',
    },
    libra: {
        name: 'Libra', hindi: 'तुला', symbol: '♎', glyph: '⚖️',
        dates: 'September 23 – October 22',
        element: 'Air', ruling_planet: 'Venus', quality: 'Cardinal',
        traits: ['Diplomatic', 'Fair-minded', 'Social', 'Gracious', 'Idealistic'],
        strengths: 'Natural diplomacy, aesthetic sense, charm, and an innate ability to see all sides.',
        challenges: 'Indecisiveness, people-pleasing, avoidance of confrontation, and superficiality.',
        lucky_color: 'Pink', lucky_number: '6', compatible: 'Gemini, Aquarius, Leo',
        desc: 'Ruled by Venus, Libra seeks beauty, balance, and harmonious relationships above all. Librans are the consummate diplomats — refined, fair, and deeply idealistic about love and justice.',
    },
    scorpio: {
        name: 'Scorpio', hindi: 'वृश्चिक', symbol: '♏', glyph: '🦂',
        dates: 'October 23 – November 21',
        element: 'Water', ruling_planet: 'Mars & Ketu', quality: 'Fixed',
        traits: ['Intense', 'Perceptive', 'Determined', 'Passionate', 'Resourceful'],
        strengths: 'Depth of perception, unwavering determination, transformative power, and magnetic presence.',
        challenges: 'Jealousy, secretiveness, controlling behaviour, and difficulty forgiving.',
        lucky_color: 'Dark Red', lucky_number: '8', compatible: 'Cancer, Pisces, Virgo',
        desc: 'Scorpio is the sign of death and rebirth — transformation at its most profound. Ruled by Mars and Ketu, Scorpios possess penetrating insight and an almost psychic ability to uncover hidden truths.',
    },
    sagittarius: {
        name: 'Sagittarius', hindi: 'धनु', symbol: '♐', glyph: '🏹',
        dates: 'November 22 – December 21',
        element: 'Fire', ruling_planet: 'Jupiter', quality: 'Mutable',
        traits: ['Optimistic', 'Adventurous', 'Philosophical', 'Honest', 'Freedom-loving'],
        strengths: 'Boundless optimism, thirst for knowledge, philosophical wisdom, and inspiring generosity.',
        challenges: 'Over-promising, tactlessness, restlessness, and inability to focus long-term.',
        lucky_color: 'Purple', lucky_number: '3', compatible: 'Aries, Leo, Aquarius',
        desc: 'Ruled by Jupiter — the planet of expansion and wisdom — Sagittarius is the great explorer of the zodiac. Archers seek meaning, truth, and adventure across cultures, philosophies, and horizons.',
    },
    capricorn: {
        name: 'Capricorn', hindi: 'मकर', symbol: '♑', glyph: '🐐',
        dates: 'December 22 – January 19',
        element: 'Earth', ruling_planet: 'Saturn', quality: 'Cardinal',
        traits: ['Disciplined', 'Ambitious', 'Responsible', 'Strategic', 'Persistent'],
        strengths: 'Extraordinary discipline, long-term strategic vision, leadership, and the ability to build lasting structures.',
        challenges: 'Workaholism, pessimism, emotional rigidity, and excessive focus on status.',
        lucky_color: 'Black/Brown', lucky_number: '8', compatible: 'Taurus, Virgo, Scorpio',
        desc: 'Ruled by Saturn — planet of karma and discipline — Capricorn is the zodiac\'s supreme achiever. Patient and strategic, Capricorns build empires through sustained effort and mastery of their chosen craft.',
    },
    aquarius: {
        name: 'Aquarius', hindi: 'कुंभ', symbol: '♒', glyph: '🏺',
        dates: 'January 20 – February 18',
        element: 'Air', ruling_planet: 'Saturn & Rahu', quality: 'Fixed',
        traits: ['Innovative', 'Humanitarian', 'Independent', 'Intellectual', 'Eccentric'],
        strengths: 'Visionary thinking, humanitarian ideals, technological brilliance, and fierce independence.',
        challenges: 'Emotional detachment, rebellion, unpredictability, and detachment from feelings.',
        lucky_color: 'Electric Blue', lucky_number: '4', compatible: 'Gemini, Libra, Sagittarius',
        desc: 'Ruled by Saturn and Rahu, Aquarius is the visionary rebel — the sign that dares to imagine a radically different future. Aquarians are ahead of their time, driven by ideals of freedom and human progress.',
    },
    pisces: {
        name: 'Pisces', hindi: 'मीन', symbol: '♓', glyph: '🐟',
        dates: 'February 19 – March 20',
        element: 'Water', ruling_planet: 'Jupiter & Neptune', quality: 'Mutable',
        traits: ['Compassionate', 'Intuitive', 'Artistic', 'Dreamy', 'Selfless'],
        strengths: 'Deep compassion, boundless creativity, spiritual sensitivity, and healing presence.',
        challenges: 'Escapism, over-idealism, boundary difficulties, and susceptibility to illusion.',
        lucky_color: 'Sea Green', lucky_number: '7', compatible: 'Cancer, Scorpio, Capricorn',
        desc: 'Ruled by Jupiter and Neptune, Pisces dissolves boundaries between the material and spiritual worlds. The dreamers of the zodiac, Pisceans possess rare empathy and an otherworldly creative imagination.',
    },
};

interface DailyPrediction {
    overview?: string;
    love?: string;
    career?: string;
    health?: string;
    [key: string]: string | undefined;
}

const HoroscopeSign: React.FC = () => {
    const { sign } = useParams<{ sign: string }>();
    const data = sign ? SIGNS[sign.toLowerCase()] : undefined;

    const [prediction, setPrediction] = useState<DailyPrediction | null>(null);
    const [predLoading, setPredLoading] = useState(true);

    useEffect(() => {
        if (!sign || !data) return;
        const today = new Date().toISOString().slice(0, 10);
        api.cms.getHoroscopes(sign.toUpperCase(), 'DAILY', today)
            .then((results: Array<{ content?: DailyPrediction }>) => {
                const entry = Array.isArray(results) ? results[0] : null;
                setPrediction(entry?.content ?? null);
            })
            .catch(() => setPrediction(null))
            .finally(() => setPredLoading(false));
    }, [sign]);

    if (!data) return <Navigate to="/astrologers" replace />;

    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                name: `${data.name} Horoscope (${data.hindi}) – Daily, Monthly & Yearly | Aadikarta`,
                description: `${data.name} horoscope — dates ${data.dates}, element ${data.element}, ruling planet ${data.ruling_planet}. Get personalised ${data.name} predictions from expert Vedic astrologers on Aadikarta.`,
                url: `https://aadikarta.org/horoscope/${sign}`,
            },
            {
                '@type': 'FAQPage',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: `What are ${data.name} dates?`,
                        acceptedAnswer: { '@type': 'Answer', text: `${data.name} dates are ${data.dates}.` },
                    },
                    {
                        '@type': 'Question',
                        name: `What is ${data.name}'s ruling planet?`,
                        acceptedAnswer: { '@type': 'Answer', text: `${data.name} is ruled by ${data.ruling_planet}.` },
                    },
                    {
                        '@type': 'Question',
                        name: `What element is ${data.name}?`,
                        acceptedAnswer: { '@type': 'Answer', text: `${data.name} belongs to the ${data.element} element.` },
                    },
                    {
                        '@type': 'Question',
                        name: `Which signs are most compatible with ${data.name}?`,
                        acceptedAnswer: { '@type': 'Answer', text: `${data.name} is most compatible with ${data.compatible}.` },
                    },
                    {
                        '@type': 'Question',
                        name: `What is the lucky number for ${data.name}?`,
                        acceptedAnswer: { '@type': 'Answer', text: `The lucky number for ${data.name} is ${data.lucky_number}.` },
                    },
                ],
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                    { '@type': 'ListItem', position: 2, name: 'Horoscope', item: 'https://aadikarta.org/horoscope' },
                    { '@type': 'ListItem', position: 3, name: `${data.name} Horoscope`, item: `https://aadikarta.org/horoscope/${sign}` },
                ],
            },
        ],
    };

    return (
        <div className="horoscope-sign-page min-h-screen">
            <SEO
                title={`${data.name} Horoscope (${data.hindi}) | Aadikarta`}
                description={`${data.name} horoscope today — dates ${data.dates}, element ${data.element}, ruling planet ${data.ruling_planet}. ${data.strengths.slice(0, 80)}. Get your personalised ${data.name} reading.`}
                structuredData={structuredData}
            />
            <Header />

            <main className="relative overflow-hidden pb-24">
                {/* Background glows */}
                <div className="absolute top-[10%] left-[-200px] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-[40%] right-[-200px] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                {/* Hero */}
                <section className="relative pt-24 pb-16 px-6 text-center">
                    <div className="max-w-3xl mx-auto relative z-10">
                        <div className="rashi-icon-wrapper">
                            <span role="img" aria-label={`${data.name} icon`}>{data.glyph}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-normal mb-4 tracking-tight">
                            {data.name} <span className="text-amber-500 font-medium">({data.hindi})</span>
                        </h1>
                        <p className="text-gray-300 text-lg mt-3 font-medium">{data.dates}</p>
                        
                        <div className="flex justify-center gap-4 mt-6 flex-wrap">
                            <span className="meta-chip">Element: <strong>{data.element}</strong></span>
                            <span className="meta-chip">Ruling Planet: <strong>{data.ruling_planet}</strong></span>
                            <span className="meta-chip">Quality: <strong>{data.quality}</strong></span>
                        </div>
                        
                        <a
                            href="#prediction-section"
                            className="inline-block mt-10 bg-amber-500 text-indigo-950 font-normal px-10 py-4 rounded-full shadow-2xl hover:bg-amber-400 transition-all active:scale-95"
                        >
                            Read Today's Forecast
                        </a>
                    </div>
                </section>

                {/* Today's Daily Prediction */}
                <section id="prediction-section" className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                    <div className="glass-panel p-8 md:p-10">
                        <h2 className="text-2xl md:text-3xl font-normal text-white mb-2 flex items-center justify-between flex-wrap gap-4">
                            <span>{data.name} Horoscope Today</span>
                            <span className="text-sm font-normal text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-4 py-1.5 rounded-full">
                                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </h2>

                        {predLoading ? (
                            <div className="animate-pulse space-y-3 mt-8">
                                <div className="h-4 bg-white/5 rounded w-full" />
                                <div className="h-4 bg-white/5 rounded w-5/6" />
                                <div className="h-4 bg-white/5 rounded w-4/6" />
                            </div>
                        ) : prediction?.overview ? (
                            <div className="mt-8 space-y-8">
                                <p className="text-gray-300 text-lg leading-relaxed">{prediction.overview}</p>
                                {(prediction.love || prediction.career || prediction.health) && (
                                    <div className="grid md:grid-cols-3 gap-6 mt-8">
                                        {prediction.love && (
                                            <div className="prediction-card love">
                                                <div className="title text-rose-400">Love & Relations</div>
                                                <p className="content">{prediction.love}</p>
                                            </div>
                                        )}
                                        {prediction.career && (
                                            <div className="prediction-card career">
                                                <div className="title text-blue-400">Career & Finance</div>
                                                <p className="content">{prediction.career}</p>
                                            </div>
                                        )}
                                        {prediction.health && (
                                            <div className="prediction-card health">
                                                <div className="title text-emerald-400">Health & Vigor</div>
                                                <p className="content">{prediction.health}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-8 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center text-4xl" role="img" aria-label={`${data.name} icon`}>
                                    {data.glyph}
                                </div>
                                <div>
                                    <p className="text-gray-300">Today's full prediction for {data.name} is available. Consult with our expert Vedic astrologers for personal predictions.</p>
                                    <Link to="/astrologers" className="inline-block mt-3 text-amber-500 font-normal hover:text-amber-400 hover:underline">
                                        Consult with Astrologer Now →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sign Overview */}
                <section className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                    <div className="glass-panel p-8 md:p-10">
                        <h2 className="text-3xl font-normal text-white mb-6">{data.name} Personality</h2>
                        <p className="text-gray-300 text-lg leading-relaxed mb-10">{data.desc}</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="personality-box strengths">
                                <h3 className="font-normal text-lg text-emerald-400 mb-3">Core Strengths</h3>
                                <p className="text-gray-300 leading-relaxed text-sm">{data.strengths}</p>
                            </div>
                            <div className="personality-box challenges">
                                <h3 className="font-normal text-lg text-amber-500 mb-3">Potential Challenges</h3>
                                <p className="text-gray-300 leading-relaxed text-sm">{data.challenges}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Traits */}
                <section className="py-12 px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl font-normal text-white mb-8">Key Character Traits</h2>
                        <div className="flex flex-wrap justify-center gap-3">
                            {data.traits.map((t, i) => (
                                <span key={i} className="bg-white/5 border border-white/10 text-amber-500 font-normal px-6 py-2.5 rounded-full shadow-md text-sm hover:border-amber-500/30 transition-colors">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Lucky details */}
                <section className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                    <div className="glass-panel p-8">
                        <h2 className="text-2xl font-normal text-white mb-8 text-center">Quick Facts</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Lucky Color', value: data.lucky_color },
                                { label: 'Lucky Number', value: data.lucky_number },
                                { label: 'Compatible', value: data.compatible },
                                { label: 'Ruler', value: data.ruling_planet },
                            ].map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center transition-colors hover:border-white/20">
                                    <div className="text-xs uppercase tracking-wider text-gray-400 font-normal mb-2">{item.label}</div>
                                    <div className="font-normal text-white text-base">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* All Signs Nav */}
                <section className="py-12 px-6 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-normal text-white mb-8 text-center">Explore Other Zodiac Signs</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {Object.entries(SIGNS).map(([slug, s]) => (
                                <Link
                                    key={slug}
                                    to={`/horoscope/${slug}`}
                                    className={`zodiac-nav-card flex flex-col items-center p-4 rounded-xl border text-center transition-all ${slug === sign?.toLowerCase()
                                        ? 'active'
                                        : 'text-gray-300 border-white/5 hover:border-amber-500/30'
                                        }`}
                                >
                                    <span className="text-2xl flex justify-center mb-2" role="img" aria-label={`${s.name} icon`}>
                                        {s.symbol}
                                    </span>
                                    <span className="text-xs font-normal name">{s.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                    <div className="glass-panel p-8 md:p-12 text-center bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/10">
                        <h2 className="text-3xl font-normal mb-4 text-white">Want a Personalised {data.name} Reading?</h2>
                        <p className="text-gray-300 mb-8 text-lg max-w-xl mx-auto">
                            Connect with verified Vedic astrologers who specialize in {data.name} birth charts — live, 24/7.
                        </p>
                        <Link
                            to="/astrologers"
                            className="inline-block bg-amber-500 text-indigo-950 font-normal px-12 py-4 rounded-full shadow-2xl hover:bg-amber-400 transition-all active:scale-95"
                        >
                            Connect with an Astrologer
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default HoroscopeSign;
