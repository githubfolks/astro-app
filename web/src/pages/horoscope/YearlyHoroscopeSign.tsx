import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { api } from '../../services/api';
import { ZODIAC_SIGNS, ZODIAC_SIGN_LIST } from '../../data/zodiacSigns';
import './HoroscopeSign.css';

interface YearlyPrediction {
    overview?: string;
    love?: string;
    career?: string;
    health?: string;
    [key: string]: string | undefined;
}

const YearlyHoroscopeSign: React.FC = () => {
    const { sign } = useParams<{ sign: string }>();
    const data = sign ? ZODIAC_SIGNS[sign.toLowerCase()] : undefined;
    const year = new Date().getFullYear();

    const [prediction, setPrediction] = useState<YearlyPrediction | null>(null);
    const [loading, setLoading] = useState(true);
    const [predLang, setPredLang] = useState<'en' | 'hi'>('en');
    const [predTranslations, setPredTranslations] = useState<Record<string, string>>({});
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
        setPredLang('en');
        setPredTranslations({});
        if (!sign || !data) return;
        setLoading(true);
        api.cms.getHoroscopes(sign.toUpperCase(), 'YEARLY', `${year}-01-01`)
            .then((results: Array<{ content?: YearlyPrediction }>) => {
                const entry = Array.isArray(results) ? results[0] : null;
                setPrediction(entry?.content ?? null);
            })
            .catch(() => setPrediction(null))
            .finally(() => setLoading(false));
    }, [sign, data, year]);

    // Keys/text currently on screen — sent for translation and looked up by
    // key when rendering in Hindi.
    const predictionTexts: Record<string, string> = prediction?.overview
        ? {
            overview: prediction.overview,
            ...(prediction.love ? { love: prediction.love } : {}),
            ...(prediction.career ? { career: prediction.career } : {}),
            ...(prediction.health ? { health: prediction.health } : {}),
        }
        : {};

    const text = (key: string, fallback: string) =>
        predLang === 'hi' && predTranslations[key] ? predTranslations[key] : fallback;

    const toggleHindi = async () => {
        if (predLang === 'hi') {
            setPredLang('en');
            return;
        }
        setPredLang('hi');
        const missing = Object.entries(predictionTexts).filter(([key]) => !predTranslations[key]);
        if (missing.length === 0) return;
        setTranslating(true);
        try {
            const results = await Promise.all(
                missing.map(([, value]) => api.freeTools.translate(value, 'hi').catch(() => null))
            );
            setPredTranslations((prev) => {
                const next = { ...prev };
                missing.forEach(([key], i) => {
                    const translated = results[i]?.translated_text;
                    if (translated) next[key] = translated;
                });
                return next;
            });
        } finally {
            setTranslating(false);
        }
    };

    if (!data) return <Navigate to="/astrologers" replace />;

    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                name: `${data.name} Yearly Horoscope ${year} (${data.hindi}) | Aadikarta Vedic Astrology`,
                description: `${data.name} yearly horoscope for ${year} — dates ${data.dates}, element ${data.element}, ruling planet ${data.ruling_planet}. Get personalized ${data.name} predictions from expert Vedic astrologers on Aadikarta Vedic Astrology.`,
                url: `https://aadikarta.org/services/horoscope/yearly/${sign}`,
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                    { '@type': 'ListItem', position: 2, name: 'Horoscope', item: 'https://aadikarta.org/services/horoscope' },
                    { '@type': 'ListItem', position: 3, name: 'Yearly Horoscope', item: 'https://aadikarta.org/services/horoscope/yearly' },
                    { '@type': 'ListItem', position: 4, name: `${data.name} Yearly Horoscope`, item: `https://aadikarta.org/services/horoscope/yearly/${sign}` },
                ],
            },
        ],
    };

    return (
        <div className="horoscope-sign-page min-h-screen">
            <SEO
                title={`${data.name} Yearly Horoscope ${year} (${data.hindi}) | Aadikarta Vedic Astrology`}
                description={`${data.name} horoscope for ${year} — dates ${data.dates}, element ${data.element}, ruling planet ${data.ruling_planet}. Get your personalized ${data.name} yearly reading on Aadikarta Vedic Astrology.`}
                keywords={`Aadikarta Vedic Astrology, ${data.name} yearly horoscope ${year}, ${data.hindi} varshik rashiphal, ${data.name} astrology reading, talk to astrologer for ${data.name}`}
                noindex={!loading && !prediction?.overview}
                structuredData={structuredData}
            />
            <Header />

            <main className="relative overflow-hidden pb-24">
                <div className="absolute top-[10%] left-[-200px] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-[40%] right-[-200px] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <section className="relative pt-10 pb-6 md:pt-24 md:pb-16 px-6 text-center">
                    <div className="max-w-3xl mx-auto relative z-10">
                        <div className="rashi-icon-wrapper">
                            <span role="img" aria-label={`${data.name} icon`}>{data.glyph}</span>
                        </div>
                        <h1 className="text-3xl md:text-6xl font-normal mb-2 md:mb-4 tracking-tight">
                            {data.name} <span className="text-amber-500 font-medium">({data.hindi})</span>
                        </h1>
                        <p className="text-gray-300 text-base md:text-lg mt-2 md:mt-3 font-medium">{year} Yearly Horoscope</p>

                        <div className="flex justify-center gap-2 md:gap-4 mt-4 md:mt-6 flex-wrap">
                            <span className="meta-chip">Element: <strong>{data.element}</strong></span>
                            <span className="meta-chip">Ruling Planet: <strong>{data.ruling_planet}</strong></span>
                            <span className="meta-chip">Quality: <strong>{data.quality}</strong></span>
                        </div>

                        <Link
                            to={`/services/horoscope/${sign}`}
                            className="inline-block mt-5 md:mt-8 text-sm text-amber-500/80 hover:text-amber-400 underline underline-offset-4"
                        >
                            View today's {data.name} horoscope →
                        </Link>
                    </div>
                </section>

                <section id="prediction-section" className="max-w-4xl mx-auto px-6 py-5 md:py-12 relative z-10">
                    <div className="glass-panel p-5 md:p-10">
                        <h2 className="text-2xl md:text-3xl font-normal text-white mb-2 flex items-center justify-between flex-wrap gap-4">
                            <span>{data.name} {year} Yearly Forecast</span>
                            {Object.keys(predictionTexts).length > 0 && (
                                <button
                                    type="button"
                                    onClick={toggleHindi}
                                    disabled={translating}
                                    className="text-sm font-normal text-white bg-white/5 border border-white/10 hover:border-amber-500/30 px-4 py-1.5 rounded-full transition-colors disabled:opacity-60"
                                >
                                    {translating ? 'अनुवाद हो रहा है…' : predLang === 'hi' ? 'Show in English' : 'हिंदी में पढ़ें'}
                                </button>
                            )}
                        </h2>

                        {loading ? (
                            <div className="animate-pulse space-y-3 mt-8">
                                <div className="h-4 bg-white/5 rounded w-full" />
                                <div className="h-4 bg-white/5 rounded w-5/6" />
                                <div className="h-4 bg-white/5 rounded w-4/6" />
                            </div>
                        ) : prediction?.overview ? (
                            <div className="mt-4 md:mt-8 space-y-4 md:space-y-8">
                                <p className="text-gray-300 text-sm md:text-lg leading-relaxed">{text('overview', prediction.overview)}</p>
                                {(prediction.love || prediction.career || prediction.health) && (
                                    <div className="grid grid-cols-1 gap-4 md:gap-6 mt-4 md:mt-8">
                                        {prediction.love && (
                                            <div className="prediction-card love">
                                                <div className="icon" aria-hidden="true">❤️</div>
                                                <div className="title text-rose-400">Love & Relations</div>
                                                <p className="content">{text('love', prediction.love)}</p>
                                            </div>
                                        )}
                                        {prediction.career && (
                                            <div className="prediction-card career">
                                                <div className="icon" aria-hidden="true">💼</div>
                                                <div className="title text-blue-400">Career & Finance</div>
                                                <p className="content">{text('career', prediction.career)}</p>
                                            </div>
                                        )}
                                        {prediction.health && (
                                            <div className="prediction-card health">
                                                <div className="icon" aria-hidden="true">💪</div>
                                                <div className="title text-emerald-400">Health & Vigor</div>
                                                <p className="content">{text('health', prediction.health)}</p>
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
                                    <p className="text-gray-300">The {year} yearly forecast for {data.name} is being prepared. Consult with our expert Vedic astrologers for a personalized yearly reading in the meantime.</p>
                                    <Link to="/astrologers" className="inline-block mt-3 text-amber-500 font-normal hover:text-amber-400 hover:underline">
                                        Consult with Astrologer Now →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="max-w-4xl mx-auto px-6 py-6 md:py-12 relative z-10">
                    <div className="glass-panel p-5 md:p-10">
                        <h2 className="text-xl md:text-3xl font-normal text-white mb-3 md:mb-6">{data.name} Personality</h2>
                        <p className="text-gray-300 text-sm md:text-lg leading-relaxed mb-5 md:mb-10">{data.desc}</p>

                        <div className="grid md:grid-cols-2 gap-3 md:gap-6">
                            <div className="personality-box strengths">
                                <h3 className="font-normal text-base md:text-lg text-emerald-400 mb-2 md:mb-3">Core Strengths</h3>
                                <p className="text-gray-300 leading-relaxed text-sm">{data.strengths}</p>
                            </div>
                            <div className="personality-box challenges">
                                <h3 className="font-normal text-base md:text-lg text-amber-500 mb-2 md:mb-3">Potential Challenges</h3>
                                <p className="text-gray-300 leading-relaxed text-sm">{data.challenges}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-6 md:py-12 px-6 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-lg md:text-2xl font-normal text-white mb-4 md:mb-8 text-center">Explore Other Zodiac Signs</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {ZODIAC_SIGN_LIST.map((s) => (
                                <Link
                                    key={s.slug}
                                    to={`/services/horoscope/yearly/${s.slug}`}
                                    className={`zodiac-nav-card flex flex-col items-center p-4 rounded-xl border text-center transition-all ${s.slug === sign?.toLowerCase()
                                        ? 'active'
                                        : 'text-gray-300 border-white/5 hover:border-amber-500/30'
                                        }`}
                                >
                                    <span className="text-2xl flex justify-center mb-2" role="img" aria-label={`${s.name} icon`}>
                                        {s.glyph}
                                    </span>
                                    <span className="text-xs font-normal name">{s.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="max-w-4xl mx-auto px-6 py-6 md:py-12 relative z-10">
                    <div className="glass-panel p-5 md:p-12 text-center bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/10">
                        <h2 className="text-xl md:text-3xl font-normal mb-2 md:mb-4 text-white">Want a Personalised {data.name} Reading?</h2>
                        <p className="text-gray-300 mb-4 md:mb-8 text-sm md:text-lg max-w-xl mx-auto">
                            Connect with verified Vedic astrologers who specialize in {data.name} birth charts — live, 24/7.
                        </p>
                        <Link
                            to="/astrologers"
                            className="inline-block bg-amber-500 text-indigo-950 font-normal px-8 py-3 md:px-12 md:py-4 rounded-full shadow-2xl hover:bg-amber-400 transition-all active:scale-95"
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

export default YearlyHoroscopeSign;
