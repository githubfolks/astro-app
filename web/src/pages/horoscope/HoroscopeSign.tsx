import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { api } from '../../services/api';
import { ZODIAC_SIGNS as SIGNS } from '../../data/zodiacSigns';
import './HoroscopeSign.css';

interface DailyPrediction {
    overview?: string;
    love?: string;
    career?: string;
    health?: string;
    [key: string]: string | undefined;
}

interface FreeAstroSignHoroscope {
    scores?: { overall?: number; love?: number; career?: number; money?: number; health?: number };
    score_factors?: Array<{ dimension: string; reason: string }>;
    lucky?: {
        color?: { key: string; label: string };
        number?: number;
        time_window?: { display: string };
    };
    content?: { text?: string; theme?: string };
}

const HoroscopeSign: React.FC = () => {
    const { sign } = useParams<{ sign: string }>();
    const data = sign ? SIGNS[sign.toLowerCase()] : undefined;

    const [prediction, setPrediction] = useState<DailyPrediction | null>(null);
    const [freeAstro, setFreeAstro] = useState<FreeAstroSignHoroscope | null>(null);
    const [predLoading, setPredLoading] = useState(true);
    const [predLang, setPredLang] = useState<'en' | 'hi'>('en');
    const [predTranslations, setPredTranslations] = useState<Record<string, string>>({});
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
        setPredLang('en');
        setPredTranslations({});
        if (!sign || !data) return;
        const today = new Date().toISOString().slice(0, 10);
        api.cms.getHoroscopes(sign.toUpperCase(), 'DAILY', today)
            .then((results: Array<{ content?: DailyPrediction }>) => {
                const entry = Array.isArray(results) ? results[0] : null;
                const cmsContent = entry?.content ?? null;
                setPrediction(cmsContent);
                if (cmsContent?.overview) return;
                // No editorial content for today — fall back to the FreeAstroAPI
                // bulk feed, which is cached once/day for all 12 signs anyway.
                return api.freeTools.dailyHoroscope()
                    .then((res: { horoscope_data?: { data?: Record<string, FreeAstroSignHoroscope> } }) => {
                        setFreeAstro(res?.horoscope_data?.data?.[sign.toLowerCase()] ?? null);
                    })
                    .catch(() => setFreeAstro(null));
            })
            .catch(() => setPrediction(null))
            .finally(() => setPredLoading(false));
    }, [sign, data]);

    const scoreReason = (dimension: string) =>
        freeAstro?.score_factors?.find((f) => f.dimension === dimension)?.reason;

    // Keys/text for whichever prediction source is currently shown; these get
    // sent for translation and looked up by key when rendering in Hindi.
    const predictionTexts: Record<string, string> = prediction?.overview
        ? {
            overview: prediction.overview,
            ...(prediction.love ? { love: prediction.love } : {}),
            ...(prediction.career ? { career: prediction.career } : {}),
            ...(prediction.health ? { health: prediction.health } : {}),
        }
        : freeAstro?.content?.text
            ? {
                overview: freeAstro.content.text,
                love: scoreReason('love') || 'General planetary influence on love and relationships today.',
                career: scoreReason('career') || 'General planetary influence on career and finances today.',
                health: scoreReason('health') || 'General planetary influence on health and vitality today.',
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
                name: `${data.name} Horoscope (${data.hindi}) – Daily, Monthly & Yearly | Aadikarta Vedic Astrology`,
                description: `${data.name} horoscope — dates ${data.dates}, element ${data.element}, ruling planet ${data.ruling_planet}. Get personalized ${data.name} predictions from expert Vedic astrologers on Aadikarta Vedic Astrology.`,
                url: `https://aadikarta.org/services/horoscope/${sign}`,
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
                    { '@type': 'ListItem', position: 2, name: 'Horoscope', item: 'https://aadikarta.org/services/horoscope' },
                    { '@type': 'ListItem', position: 3, name: `${data.name} Horoscope`, item: `https://aadikarta.org/services/horoscope/${sign}` },
                ],
            },
        ],
    };

    return (
        <div className="horoscope-sign-page min-h-screen">
            <SEO
                title={`${data.name} Horoscope (${data.hindi}) | Aadikarta Vedic Astrology`}
                description={`${data.name} horoscope today — dates ${data.dates}, element ${data.element}, ruling planet ${data.ruling_planet}. Get your personalized ${data.name} reading on Aadikarta Vedic Astrology.`}
                keywords={`Aadikarta Vedic Astrology, ${data.name} horoscope today, ${data.hindi} rashiphal, ${data.name} astrology reading, talk to astrologer for ${data.name}`}
                structuredData={structuredData}
            />
            <Header />

            <main className="relative overflow-hidden pb-24">
                {/* Background glows */}
                <div className="absolute top-[10%] left-[-200px] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-[40%] right-[-200px] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                {/* Hero */}
                <section className="relative pt-10 pb-6 md:pt-24 md:pb-16 px-6 text-center">
                    <div className="max-w-3xl mx-auto relative z-10">
                        <div className="rashi-icon-wrapper">
                            <span role="img" aria-label={`${data.name} icon`}>{data.glyph}</span>
                        </div>
                        <h1 className="text-3xl md:text-6xl font-normal mb-2 md:mb-4 tracking-tight">
                            {data.name} <span className="text-amber-500 font-medium">({data.hindi})</span>
                        </h1>
                        <p className="text-gray-300 text-base md:text-lg mt-2 md:mt-3 font-medium">{data.dates}</p>

                        <div className="flex justify-center gap-2 md:gap-4 mt-4 md:mt-6 flex-wrap">
                            <span className="meta-chip">Element: <strong>{data.element}</strong></span>
                            <span className="meta-chip">Ruling Planet: <strong>{data.ruling_planet}</strong></span>
                            <span className="meta-chip">Quality: <strong>{data.quality}</strong></span>
                        </div>

                        <a
                            href="#prediction-section"
                            className="inline-block mt-5 md:mt-10 bg-amber-500 text-indigo-950 font-normal px-8 py-3 md:px-10 md:py-4 rounded-full shadow-2xl hover:bg-amber-400 transition-all active:scale-95"
                        >
                            Read Today's Forecast
                        </a>
                        <div>
                            <Link
                                to={`/services/horoscope/yearly/${sign}`}
                                className="inline-block mt-4 md:mt-6 text-sm text-amber-500/80 hover:text-amber-400 underline underline-offset-4"
                            >
                                View {data.name}'s Yearly Horoscope →
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Today's Daily Prediction */}
                <section id="prediction-section" className="max-w-4xl mx-auto px-6 py-5 md:py-12 relative z-10">
                    <div className="glass-panel p-5 md:p-10">
                        <h2 className="text-2xl md:text-3xl font-normal text-white mb-2 flex items-center justify-between flex-wrap gap-4">
                            <span>{data.name} Horoscope Today</span>
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                <span className="text-sm font-normal text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-4 py-1.5 rounded-full">
                                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
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
                            </div>
                        </h2>

                        {predLoading ? (
                            <div className="animate-pulse space-y-3 mt-8">
                                <div className="h-4 bg-white/5 rounded w-full" />
                                <div className="h-4 bg-white/5 rounded w-5/6" />
                                <div className="h-4 bg-white/5 rounded w-4/6" />
                            </div>
                        ) : prediction?.overview ? (
                            <div className="mt-4 md:mt-8 space-y-4 md:space-y-8">
                                <p className="text-gray-300 text-sm md:text-lg leading-relaxed text-justify">{text('overview', prediction.overview)}</p>
                                {(prediction.love || prediction.career || prediction.health) && (
                                    <div className="grid md:grid-cols-3 gap-3 md:gap-6 mt-4 md:mt-8">
                                        {prediction.love && (
                                            <div className="prediction-card love">
                                                <div className="title text-rose-400">Love & Relations</div>
                                                <p className="content">{text('love', prediction.love)}</p>
                                            </div>
                                        )}
                                        {prediction.career && (
                                            <div className="prediction-card career">
                                                <div className="title text-blue-400">Career & Finance</div>
                                                <p className="content">{text('career', prediction.career)}</p>
                                            </div>
                                        )}
                                        {prediction.health && (
                                            <div className="prediction-card health">
                                                <div className="title text-emerald-400">Health & Vigor</div>
                                                <p className="content">{text('health', prediction.health)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : freeAstro?.content?.text ? (
                            <div className="mt-4 md:mt-8 space-y-4 md:space-y-8">
                                <p className="text-gray-300 text-sm md:text-lg leading-relaxed text-justify">{text('overview', freeAstro.content.text)}</p>
                                {freeAstro.scores && (
                                    <div className="grid md:grid-cols-3 gap-3 md:gap-6 mt-4 md:mt-8">
                                        <div className="prediction-card love">
                                            <div className="title text-rose-400">Love & Relations · {freeAstro.scores.love ?? '—'}/100</div>
                                            <p className="content">{text('love', scoreReason('love') || 'General planetary influence on love and relationships today.')}</p>
                                        </div>
                                        <div className="prediction-card career">
                                            <div className="title text-blue-400">Career & Finance · {freeAstro.scores.career ?? '—'}/100</div>
                                            <p className="content">{text('career', scoreReason('career') || 'General planetary influence on career and finances today.')}</p>
                                        </div>
                                        <div className="prediction-card health">
                                            <div className="title text-emerald-400">Health & Vigor · {freeAstro.scores.health ?? '—'}/100</div>
                                            <p className="content">{text('health', scoreReason('health') || 'General planetary influence on health and vitality today.')}</p>
                                        </div>
                                    </div>
                                )}
                                {freeAstro.lucky && (
                                    <div className="flex flex-wrap justify-center gap-4 pt-2">
                                        {freeAstro.lucky.color && (
                                            <span className="meta-chip">Lucky Color: <strong>{freeAstro.lucky.color.label}</strong></span>
                                        )}
                                        {freeAstro.lucky.number != null && (
                                            <span className="meta-chip">Lucky Number: <strong>{freeAstro.lucky.number}</strong></span>
                                        )}
                                        {freeAstro.lucky.time_window && (
                                            <span className="meta-chip">Lucky Time: <strong>{freeAstro.lucky.time_window.display}</strong></span>
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
                <section className="max-w-4xl mx-auto px-6 py-6 md:py-12 relative z-10">
                    <div className="glass-panel p-5 md:p-10">
                        <h2 className="text-xl md:text-3xl font-normal text-white mb-3 md:mb-6">{data.name} Personality</h2>
                        <p className="text-gray-300 text-sm md:text-lg leading-relaxed mb-5 md:mb-10 text-justify">{data.desc}</p>

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

                {/* Traits */}
                <section className="py-6 md:py-12 px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-lg md:text-2xl font-normal text-white mb-4 md:mb-8">Key Character Traits</h2>
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                            {data.traits.map((t, i) => (
                                <span key={i} className="bg-white/5 border border-white/10 text-amber-500 font-normal px-4 py-2 md:px-6 md:py-2.5 rounded-full shadow-md text-xs md:text-sm hover:border-amber-500/30 transition-colors">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Lucky details */}
                <section className="max-w-4xl mx-auto px-6 py-6 md:py-12 relative z-10">
                    <div className="glass-panel p-4 md:p-8">
                        <h2 className="text-lg md:text-2xl font-normal text-white mb-4 md:mb-8 text-center">Quick Facts</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
                            {[
                                { label: 'Lucky Color', value: data.lucky_color },
                                { label: 'Lucky Number', value: data.lucky_number },
                                { label: 'Compatible', value: data.compatible },
                                { label: 'Ruler', value: data.ruling_planet },
                            ].map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 text-center transition-colors hover:border-white/20">
                                    <div className="text-[10px] md:text-xs uppercase tracking-wider text-gray-400 font-normal mb-1 md:mb-2">{item.label}</div>
                                    <div className="font-normal text-white text-sm md:text-base">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* All Signs Nav */}
                <section className="py-6 md:py-12 px-6 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-lg md:text-2xl font-normal text-white mb-4 md:mb-8 text-center">Explore Other Zodiac Signs</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {Object.entries(SIGNS).map(([slug, s]) => (
                                <Link
                                    key={slug}
                                    to={`/services/horoscope/${slug}`}
                                    className={`zodiac-nav-card flex flex-col items-center p-4 rounded-xl border text-center transition-all ${slug === sign?.toLowerCase()
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

                {/* CTA */}
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

export default HoroscopeSign;
