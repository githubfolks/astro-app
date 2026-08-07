import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Loader2, Compass, ShieldCheck, HeartHandshake, Sparkles, Layers, Users } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import FreeToolResult from '../../components/FreeToolResult';
import ConnectExpertCTA from '../../components/ConnectExpertCTA';
import PageHeading from '../../components/PageHeading';
import FAQSection from '../../components/FAQSection';
import CityAutocomplete from '../../components/CityAutocomplete';
import { api } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { TOOL_INPUT_CLASS, TOOL_LABEL_CLASS, TOOL_BUTTON_CLASS, TOOL_ERROR_CLASS } from '../../utils/toolFormStyles';
import '../services/ServicesDetail.css';

interface Planet {
    name?: string;
    sign?: string;
    house?: number;
    is_retrograde?: boolean;
    nakshatra?: string;
    pada?: number;
}

interface Ascendant {
    sign?: string;
    nakshatra?: { name?: string; pada?: number };
}

interface DashaPeriod {
    level?: string;
    lord?: string;
    start?: string;
    end?: string;
    remaining_years?: number;
}

interface Yoga {
    name?: string;
    type?: string;
    category?: string;
    active?: boolean;
    description?: string;
}

interface PanchangField {
    name?: string;
    pada?: number;
    paksha?: string;
}

interface Panchang {
    tithi?: PanchangField;
    nakshatra?: PanchangField;
    yoga?: { name?: string };
    sunrise?: string;
    sunset?: string;
    rahu_kalam?: { start?: string; end?: string };
}

interface FullKundli {
    chart?: { ascendant?: Ascendant; planets?: Planet[] };
    vimshottari_dasha?: { active_periods?: DashaPeriod[] };
    yogas?: { yogas?: Yoga[] };
    panchang?: Panchang;
}

// Renders FreeAstroAPI's full-kundli payload — chart (ascendant + planets),
// active Vimshottari dasha periods, active yogas/doshas, and the birth-moment
// Panchang — falling back to the generic renderer for any other shape (e.g.
// legacy cached records saved before this tool switched from the basic chart).
const KundliChartResult: React.FC<{ data: unknown }> = ({ data }) => {
    const obj = data && typeof data === 'object' ? (data as FullKundli & { ascendant?: Ascendant; planets?: Planet[] }) : null;

    // Legacy cached rows stored the basic { ascendant, planets } shape directly.
    const ascendant = obj?.chart?.ascendant ?? obj?.ascendant;
    const planets = obj?.chart?.planets ?? obj?.planets;
    const activeDashas = obj?.vimshottari_dasha?.active_periods;
    const activeYogas = obj?.yogas?.yogas?.filter((y) => y.active);
    const panchang = obj?.panchang;

    if (!ascendant && !planets) return <FreeToolResult data={data} />;

    return (
        <div className="space-y-4">
            {ascendant && (
                <div className="service-glass-panel p-6 md:p-8 border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-5">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold uppercase tracking-wider">
                            Asc
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Ascendant (Lagna)</span>
                            <h3 className="text-2xl font-normal text-amber-400 mt-1">{ascendant.sign}</h3>
                            {ascendant.nakshatra?.name && (
                                <p className="text-gray-400 text-sm mt-1">
                                    {ascendant.nakshatra.name}
                                    {ascendant.nakshatra.pada ? ` · Pada ${ascendant.nakshatra.pada}` : ''}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {planets && planets.length > 0 && (
                <div className="service-glass-panel p-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Planetary Positions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {planets.map((p, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 flex items-center justify-between">
                                <div>
                                    <span className="text-white text-sm font-medium">{p.name}{p.is_retrograde ? ' (R)' : ''}</span>
                                    {p.nakshatra && (
                                        <span className="block text-gray-500 text-xs mt-0.5">
                                            {p.nakshatra}{p.pada ? ` · Pada ${p.pada}` : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-amber-400 text-sm font-normal">{p.sign}</span>
                                    <span className="block text-gray-500 text-xs">House {p.house}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeDashas && activeDashas.length > 0 && (
                <div className="service-glass-panel p-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Current Vimshottari Dasha</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeDashas.map((d, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl border border-white/10 px-4 py-3">
                                <span className="text-xs uppercase tracking-wider text-gray-500">{d.level}</span>
                                <h5 className="text-amber-400 font-normal text-lg">{d.lord}</h5>
                                <p className="text-gray-400 text-xs mt-1">
                                    {d.start} → {d.end}
                                    {d.remaining_years != null ? ` · ${d.remaining_years.toFixed(1)}y left` : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeYogas && activeYogas.length > 0 && (
                <div className="service-glass-panel p-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Yogas & Doshas Present</h4>
                    <div className="space-y-3">
                        {activeYogas.map((y, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl border border-white/10 px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-white text-sm font-medium">{y.name}</span>
                                    <span className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full ${y.type === 'dosha' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        {y.category}
                                    </span>
                                </div>
                                {y.description && <p className="text-gray-400 text-xs mt-1">{y.description}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {panchang && (
                <div className="service-glass-panel p-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Birth Panchang</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {panchang.tithi?.name && (
                            <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 text-center">
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Tithi</span>
                                <span className="text-amber-400 text-sm font-normal">{panchang.tithi.name}{panchang.tithi.paksha ? ` (${panchang.tithi.paksha})` : ''}</span>
                            </div>
                        )}
                        {panchang.nakshatra?.name && (
                            <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 text-center">
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Nakshatra</span>
                                <span className="text-amber-400 text-sm font-normal">{panchang.nakshatra.name}</span>
                            </div>
                        )}
                        {panchang.yoga?.name && (
                            <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 text-center">
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Yoga</span>
                                <span className="text-amber-400 text-sm font-normal">{panchang.yoga.name}</span>
                            </div>
                        )}
                        {panchang.sunrise && (
                            <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 text-center">
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Sunrise</span>
                                <span className="text-amber-400 text-sm font-normal">{panchang.sunrise}</span>
                            </div>
                        )}
                        {panchang.sunset && (
                            <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 text-center">
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Sunset</span>
                                <span className="text-amber-400 text-sm font-normal">{panchang.sunset}</span>
                            </div>
                        )}
                        {panchang.rahu_kalam && (
                            <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 text-center">
                                <span className="block text-gray-500 text-xs uppercase tracking-wider">Rahu Kalam</span>
                                <span className="text-amber-400 text-sm font-normal">{panchang.rahu_kalam.start} - {panchang.rahu_kalam.end}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const faqs = [
    { question: 'What is a Kundli (birth chart)?', answer: 'A Kundli, or Vedic birth chart, is a map of where each planet was placed in the zodiac at your exact time and place of birth. It\'s the foundation every Vedic astrology reading is built on.' },
    { question: 'What is the Ascendant (Lagna)?', answer: 'The Ascendant, or Lagna, is the zodiac sign that was rising on the eastern horizon at your birth moment. It sets the reference point for all 12 houses in your chart and strongly shapes your personality and life approach.' },
    { question: 'Why do I need an exact birth time?', answer: 'The Ascendant changes roughly every two hours, so even a small error in birth time can shift your entire chart\'s house placements. For the most accurate reading, use the birth time from your birth certificate or hospital record if possible.' },
    { question: 'Is this Kundli generator free?', answer: 'Yes, this full Kundli — Ascendant, planetary positions, current Vimshottari dasha, active yogas/doshas, and birth Panchang — is completely free. For a personalized reading, you can connect with a verified astrologer on Aadikarta.' },
];

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebApplication",
            "name": "Free Kundli (Birth Chart) Generator | Aadikarta Vedic Astrology",
            "applicationCategory": "SpiritualApplication",
            "operatingSystem": "Web",
            "description": "Generate your free Vedic birth chart (Kundli) online — Ascendant, planetary positions, dashas, yogas, and Panchang.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
        },
        {
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
            }))
        },
    ],
};

const KundliChartViewer: React.FC = () => {
    useEffect(() => {
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        time_of_birth: '',
        place_of_birth: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<unknown>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (result !== null) {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [result]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await api.freeTools.kundliChart(formData);
            setResult(data.chart_data);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to generate birth chart');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Free Kundli (Birth Chart) Generator | Aadikarta Vedic Astrology"
                description="Generate your free Vedic birth chart (Kundli) online — Ascendant, planets, dasha, yogas, and Panchang, instantly, on Aadikarta Vedic Astrology."
                keywords="free kundli generator, birth chart online, Vedic astrology chart free, Janam Kundli, Aadikarta Vedic Astrology"
                structuredData={structuredData}
            />
            <Header />

            {/* Hero Section */}
            <header className="relative pt-16 pb-12 px-6 text-center overflow-hidden">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <PageHeading
                        eyebrow="Free Tool"
                        title={<>Free <span className="text-amber-500">Kundli</span> Generator</>}
                        subtitle="Enter your birth details to instantly generate your full Vedic birth chart — Ascendant, planets, dasha, yogas, and Panchang."
                    />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                {/* Form + Result */}
                <div className="max-w-4xl mx-auto relative z-10" data-aos="fade-up">
                    <div className="service-glass-panel p-6 md:p-8">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className={TOOL_LABEL_CLASS}>Full Name</label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className={TOOL_INPUT_CLASS}
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={TOOL_LABEL_CLASS}>Date of Birth *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        className={TOOL_INPUT_CLASS}
                                    />
                                </div>
                                <div>
                                    <label className={TOOL_LABEL_CLASS}>Time of Birth *</label>
                                    <input
                                        type="time"
                                        required
                                        step="1"
                                        value={formData.time_of_birth}
                                        onChange={(e) => setFormData({ ...formData, time_of_birth: e.target.value })}
                                        className={TOOL_INPUT_CLASS}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={TOOL_LABEL_CLASS}>Place of Birth *</label>
                                <CityAutocomplete
                                    required
                                    value={formData.place_of_birth}
                                    onChange={(place_of_birth) => setFormData({ ...formData, place_of_birth })}
                                    className={TOOL_INPUT_CLASS}
                                    placeholder="e.g., New Delhi, Delhi, India"
                                    dropdownClassName="bg-[#1a1530] text-white divide-y divide-white/5"
                                />
                            </div>

                            {error && (
                                <div className={TOOL_ERROR_CLASS}>{error}</div>
                            )}

                            <button type="submit" disabled={loading} className={TOOL_BUTTON_CLASS}>
                                {loading ? (<><Loader2 size={18} className="animate-spin" /> Generating...</>) : (<><Compass size={16} /> Generate Kundli</>)}
                            </button>
                        </form>
                    </div>

                    {result !== null ? (
                        <div ref={resultRef} className="mt-8 scroll-mt-24" data-aos="fade-up">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="title-icon-wrapper"><Sparkles size={20} /></div>
                                <h2 className="text-xl font-normal text-white">Your Birth Chart</h2>
                            </div>
                            <KundliChartResult data={result} />
                        </div>
                    ) : null}
                </div>

                {/* Why it matters */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" data-aos="fade-up">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="title-icon-wrapper"><Compass size={20} /></div>
                            <h2 className="text-2xl md:text-3xl font-normal text-white">Why Your Kundli Matters</h2>
                        </div>
                        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                            <p>
                                Your Kundli is a snapshot of the sky at the exact moment you were born — where the Sun, Moon, and every planet sat against the zodiac, mapped onto 12 houses of life.
                            </p>
                            <p>
                                Every other Vedic reading — Manglik Dosha, Navamsa, matching, dashas — is built on top of this one chart, which is why astrologers always start here first.
                            </p>
                        </div>
                    </div>

                    <div className="service-glass-panel p-8" data-aos="fade-left">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Ascendant', desc: 'Your rising sign & personality' },
                                { label: 'Planets', desc: 'Positions across 9 grahas' },
                                { label: 'Houses', desc: '12 areas of life' },
                                { label: 'Nakshatras', desc: 'Lunar mansions & padas' },
                            ].map((item, idx) => (
                                <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center hover:border-amber-500/20 transition-all hover:-translate-y-0.5">
                                    <span className="block text-amber-500 font-normal text-base mb-1">{item.label}</span>
                                    <span className="text-xs text-gray-400 font-light">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-center text-xs text-amber-500/60 uppercase tracking-widest font-normal">What Your Chart Reveals</div>
                    </div>
                </section>

                {/* How Aadikarta helps */}
                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl font-normal text-white mb-6">How Aadikarta Astrologers Help You</h2>
                    <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-12">
                        A free chart gives you the raw positions — only an expert astrologer can read what they actually mean for your life.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        {[
                            { icon: <Layers size={24} />, title: 'Full Chart Reading', desc: 'Dashas, yogas, and divisional charts interpreted together, not in isolation.' },
                            { icon: <ShieldCheck size={24} />, title: 'Dosha Analysis', desc: 'Identify and understand Manglik, Kala Sarpa, and other doshas in your chart.' },
                            { icon: <HeartHandshake size={24} />, title: 'Life Guidance', desc: 'Timing for marriage, career moves, and major decisions based on your dashas.' },
                            { icon: <Users size={24} />, title: 'Face-to-Face Clarity', desc: 'Direct interaction with verified Vedic experts to discuss your specific chart.' }
                        ].map((item, idx) => (
                            <div key={idx} className="custom-list-item">
                                <div className="icon-box">{item.icon}</div>
                                <div>
                                    <h4 className="text-xl font-normal text-white mb-2">{item.title}</h4>
                                    <p className="text-gray-300 font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link to="/astrologers" className="inline-block mt-16 bg-amber-500 text-indigo-950 px-12 py-4 rounded-full font-normal text-lg shadow-xl shadow-amber-500/10 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all">
                        Consult an Expert Now
                    </Link>
                </section>

                <FAQSection faqs={faqs} />
            </main>

            <ConnectExpertCTA variant="dark" text="Want your full Kundli read with dashas and yogas? Talk to an expert astrologer." />

            <Footer />
        </div>
    );
};

export default KundliChartViewer;
