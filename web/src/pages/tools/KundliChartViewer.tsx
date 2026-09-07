import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Loader2, Compass, ShieldCheck, HeartHandshake, Sparkles, Layers, Users } from 'lucide-react';
import AeoDirectAnswer from '../../components/AeoDirectAnswer';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import ConnectExpertCTA from '../../components/ConnectExpertCTA';
import PageHeading from '../../components/PageHeading';
import FAQSection from '../../components/FAQSection';
import CityAutocomplete from '../../components/CityAutocomplete';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';
import { KundliContent } from '../../components/KundliPanel';
import { api } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import type { ChartData } from '../../types';
import { TOOL_INPUT_CLASS, TOOL_LABEL_CLASS, TOOL_BUTTON_CLASS, TOOL_ERROR_CLASS } from '../../utils/toolFormStyles';
import '../services/ServicesDetail.css';

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
    const [result, setResult] = useState<ChartData | null>(null);
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
                title="Free Janam Kundli Online (Birth Chart) | Aadikarta"
                description="Generate your free Vedic birth chart (Kundli) online — Ascendant, planets, dasha, yogas, and Panchang instantly on Aadikarta."
                keywords="free kundli generator, birth chart online, Vedic astrology chart free, Janam Kundli, Aadikarta Vedic Astrology"
                structuredData={structuredData}
            />
            <Header />

            {/* Hero Section */}
            <header className="relative pt-8 pb-6 md:pt-16 md:pb-12 px-6 text-center overflow-hidden">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <PageHeading
                        eyebrow="Free Tool"
                        title={<>Free <span className="text-amber-500">Kundli</span> Generator</>}
                        subtitle="Enter your birth details to instantly generate your full Vedic birth chart — Ascendant, planets, dasha, yogas, and Panchang."
                    />

                    <AeoDirectAnswer
                        question="How is a Vedic Janam Kundli calculated?"
                        answer="A Janam Kundli (Vedic birth chart) is calculated by mapping the exact positions of the 9 Grahas (planets) across 12 Bhavas (houses) and 27 Nakshatras at the precise moment and location of birth using Lahiri Ayanamsa and sidereal astronomy algorithms."
                        keyTakeaways={[
                            { label: "Calculation Base", text: "Date, Exact Time & Birth Location" },
                            { label: "Zodiac System", text: "Vedic Sidereal (Lahiri Ayanamsa)" },
                            { label: "Key Outputs", text: "Ascendant (Lagna), Dasha Periods & Yogas" },
                            { label: "Accuracy", text: "High Precision Swiss Ephemeris Math" }
                        ]}
                    />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 md:py-12 space-y-12 md:space-y-24">
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
                                    <DatePicker
                                        required
                                        value={formData.date_of_birth}
                                        onChange={(date_of_birth) => setFormData({ ...formData, date_of_birth })}
                                        className={TOOL_INPUT_CLASS}
                                    />
                                </div>
                                <div>
                                    <label className={TOOL_LABEL_CLASS}>Time of Birth *</label>
                                    <TimePicker
                                        required
                                        withSeconds
                                        value={formData.time_of_birth}
                                        onChange={(time_of_birth) => setFormData({ ...formData, time_of_birth })}
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
                            <div className="bg-white rounded-2xl overflow-hidden">
                                <KundliContent chartData={result} />
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Why it matters */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center" data-aos="fade-up">
                    <div>
                        <div className="flex items-center gap-3 mb-3 md:mb-6">
                            <div className="title-icon-wrapper"><Compass size={20} /></div>
                            <h2 className="text-2xl md:text-3xl font-normal text-white">Why Your Kundli Matters</h2>
                        </div>
                        <div className="space-y-4 text-gray-300 text-base md:text-lg leading-relaxed">
                            <p>
                                Your Kundli is a snapshot of the sky at the exact moment you were born — where the Sun, Moon, and every planet sat against the zodiac, mapped onto 12 houses of life.
                            </p>
                            <p>
                                Every other Vedic reading — Manglik Dosha, Navamsa, matching, dashas — is built on top of this one chart, which is why astrologers always start here first.
                            </p>
                        </div>
                    </div>

                    <div className="service-glass-panel p-5 md:p-8" data-aos="fade-left">
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
                <section className="text-center py-5 md:py-10" data-aos="fade-up">
                    <h2 className="text-2xl md:text-3xl font-normal text-white mb-3 md:mb-6">How Aadikarta Astrologers Help You</h2>
                    <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-6 md:mb-12">
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
                                    <h4 className="text-lg md:text-xl font-normal text-white mb-2">{item.title}</h4>
                                    <p className="text-gray-300 font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link to="/astrologers" className="inline-block mt-8 md:mt-16 bg-amber-500 text-indigo-950 px-12 py-4 rounded-full font-normal text-base md:text-lg shadow-xl shadow-amber-500/10 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all">
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
