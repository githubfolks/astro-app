import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Loader2, Flame, ShieldCheck, HeartHandshake, Sparkles, Home, Users, Mars } from 'lucide-react';
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

interface YogaItem {
    name?: string;
    description?: string;
}

interface SadeSati {
    active?: boolean;
    phase?: string | null;
    description?: string;
    moon_sign?: string;
    saturn_sign?: string;
    saturn_is_retrograde?: boolean;
}

const isManglikYoga = (y: YogaItem) => /manglik|mangal|kuja/i.test(y.name || '');

// Renders the FreeAstroAPI yogas_data payload ({ yogas: [...], sade_sati: {...} })
// with a headline Manglik status, since that's the one thing this page exists to
// answer — falls back to the generic renderer for any other shape.
const ManglikResult: React.FC<{ data: unknown }> = ({ data }) => {
    const obj = data && typeof data === 'object' ? (data as { yogas?: YogaItem[]; sade_sati?: SadeSati }) : null;
    const yogas = obj && Array.isArray(obj.yogas) ? obj.yogas : null;

    if (!yogas) return <FreeToolResult data={data} />;

    const manglikYoga = yogas.find(isManglikYoga);
    const otherYogas = yogas.filter((y) => !isManglikYoga(y));
    const isManglik = !!manglikYoga;
    const sadeSati = obj?.sade_sati;

    return (
        <div className="space-y-4">
            <div className={`service-glass-panel p-6 md:p-8 border-l-4 ${isManglik ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                <div className="flex items-start gap-5">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${isManglik ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        <Mars size={28} />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Mangal Dosha</span>
                        <h3 className={`text-2xl font-normal mt-1 ${isManglik ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isManglik ? 'You are Manglik' : 'You are not Manglik'}
                        </h3>
                        <p className="text-gray-300 mt-2 leading-relaxed">
                            {isManglik
                                ? `Mars is placed in a Dosha-triggering house of your chart${manglikYoga?.description ? ` — ${manglikYoga.description}.` : '.'} An astrologer can help you understand the severity and suitable remedies.`
                                : 'Mars is not placed in any of the houses that trigger Manglik (Mangal) Dosha in your chart.'}
                        </p>
                    </div>
                </div>
            </div>

            {sadeSati && (
                <div className="service-glass-panel p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${sadeSati.active ? 'bg-amber-500' : 'bg-gray-600'}`}></span>
                        <h4 className="text-white font-normal">Sade Sati{sadeSati.active ? ` — ${sadeSati.phase}` : ' — Not Active'}</h4>
                    </div>
                    {sadeSati.description && <p className="text-gray-300 text-sm leading-relaxed">{sadeSati.description}</p>}
                    {sadeSati.active && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {sadeSati.moon_sign && (
                                <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-400">
                                    Moon Sign: <span className="text-gray-200 font-medium">{sadeSati.moon_sign}</span>
                                </span>
                            )}
                            {sadeSati.saturn_sign && (
                                <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-400">
                                    Saturn Sign: <span className="text-gray-200 font-medium">{sadeSati.saturn_sign}</span>
                                </span>
                            )}
                            {sadeSati.saturn_is_retrograde && (
                                <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-gray-400">Saturn Retrograde</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {otherYogas.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Other Yogas</h4>
                    {otherYogas.map((y, idx) => (
                        <div key={idx} className="bg-white/5 rounded-2xl border border-white/10 p-5">
                            {y.name && <h3 className="font-semibold text-white mb-1">{y.name}</h3>}
                            {y.description && <p className="text-gray-300 text-sm leading-relaxed">{y.description}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const houses = [
    { house: '1st House', desc: 'Affects self-confidence and temperament in marriage.' },
    { house: '2nd House', desc: 'Can influence family life and speech within the household.' },
    { house: '4th House', desc: 'Relates to domestic peace and emotional comfort at home.' },
    { house: '7th House', desc: 'Directly impacts the marriage partnership itself.' },
    { house: '8th House', desc: 'Linked to longevity concerns and sudden events in married life.' },
    { house: '12th House', desc: 'Associated with bed comforts and marital harmony.' },
];

const faqs = [
    { question: 'What is Manglik Dosha?', answer: 'Manglik Dosha (also called Mangal or Kuja Dosha) occurs when Mars is placed in the 1st, 2nd, 4th, 7th, 8th, or 12th house of a birth chart. It is traditionally considered while assessing marriage compatibility in Vedic astrology.' },
    { question: 'Is Manglik Dosha always harmful for marriage?', answer: 'Not necessarily. Its effect depends on the strength of Mars, its sign, aspects from other planets, and the overall chart. Many astrologers also consider it neutralized when both partners are Manglik.' },
    { question: 'What information do I need to check my Manglik status?', answer: 'You need your exact date of birth, time of birth, and place of birth. Since Mars placement is sensitive to the ascendant, accurate birth time matters for a reliable result.' },
    { question: 'Are there remedies for Manglik Dosha?', answer: 'Yes. Common remedies include specific pujas, fasting on Tuesdays, wearing red coral after consultation, and Kumbh Vivah in some traditions. An astrologer can recommend remedies suited to your exact chart.' },
    { question: 'Is this Manglik Dosha checker free?', answer: 'Yes, this tool is completely free to use. For a deeper reading with personalized remedies, you can connect with a verified astrologer on Aadikarta.' },
];

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebApplication",
            "name": "Free Manglik Dosha Checker | Aadikarta Vedic Astrology",
            "applicationCategory": "SpiritualApplication",
            "operatingSystem": "Web",
            "description": "Check Manglik Dosha and other Vedic yogas in your birth chart for free.",
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

const ManglikChecker: React.FC = () => {
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
            const data = await api.freeTools.manglikCheck(formData);
            setResult(data.yogas_data);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to check Manglik Dosha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Free Manglik Dosha Checker | Aadikarta Vedic Astrology"
                description="Check if you have Manglik (Mangal) Dosha and other Vedic yogas in your birth chart, free and instant, on Aadikarta Vedic Astrology."
                keywords="Manglik Dosha checker, Mangal Dosha check free, Kuja Dosha, Vedic yoga checker, Aadikarta Vedic Astrology"
                structuredData={structuredData}
            />
            <Header />

            {/* Hero Section */}
            <header className="relative pt-16 pb-12 px-6 text-center overflow-hidden">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <PageHeading
                        eyebrow="Free Tool"
                        title={<>Free <span className="text-amber-500">Manglik Dosha</span> Checker</>}
                        subtitle="Enter your birth details to instantly check for Manglik (Mangal) Dosha and other Vedic yogas in your chart."
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
                                {loading ? (<><Loader2 size={18} className="animate-spin" /> Checking...</>) : (<><Flame size={16} /> Check Manglik Dosha</>)}
                            </button>
                        </form>
                    </div>

                    {result !== null ? (
                        <div ref={resultRef} className="mt-8 scroll-mt-24" data-aos="fade-up">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="title-icon-wrapper"><Sparkles size={20} /></div>
                                <h2 className="text-xl font-normal text-white">Your Yogas & Doshas</h2>
                            </div>
                            <ManglikResult data={result} />
                        </div>
                    ) : null}
                </div>

                {/* Why it matters */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" data-aos="fade-up">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="title-icon-wrapper"><Flame size={20} /></div>
                            <h2 className="text-2xl md:text-3xl font-normal text-white">Why Manglik Dosha Matters</h2>
                        </div>
                        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                            <p>
                                Manglik (or <span className="italic text-amber-500">Mangal/Kuja</span>) Dosha occurs when Mars is placed in certain houses of a birth chart. In Vedic tradition it's considered significant for marriage compatibility, since it's believed to influence temperament and harmony between spouses.
                            </p>
                            <p>
                                Checking for it early — ideally before marriage discussions get serious — lets both families understand the chart clearly and, if needed, look at remedies or matching with another Manglik chart, rather than treating it as an unexplained obstacle later.
                            </p>
                        </div>
                    </div>

                    <div className="service-glass-panel p-8" data-aos="fade-left">
                        <div className="grid grid-cols-2 gap-4">
                            {houses.map((item, idx) => (
                                <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center hover:border-amber-500/20 transition-all hover:-translate-y-0.5">
                                    <span className="block text-amber-500 font-normal text-base mb-1">{item.house}</span>
                                    <span className="text-xs text-gray-400 font-light">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-center text-xs text-amber-500/60 uppercase tracking-widest font-normal">Mars Placements That Trigger Dosha</div>
                    </div>
                </section>

                {/* How Aadikarta helps */}
                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl font-normal text-white mb-6">How Aadikarta Astrologers Help You</h2>
                    <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-12">
                        A free check gives you a quick answer — only an expert astrologer can interpret the severity and suggest remedies suited to your exact chart.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        {[
                            { icon: <ShieldCheck size={24} />, title: 'Severity Assessment', desc: 'Understand whether your Manglik Dosha is high, medium, or low intensity based on Mars\' strength and aspects.' },
                            { icon: <HeartHandshake size={24} />, title: 'Matching Guidance', desc: 'Learn whether matching with another Manglik chart, or specific remedies, is the right path for you.' },
                            { icon: <Home size={24} />, title: 'Remedial Solutions', desc: 'Personalized remedies including pujas, fasting, and gemstone recommendations to ease the effects.' },
                            { icon: <Users size={24} />, title: 'Face-to-Face Clarity', desc: 'Direct interaction with verified Vedic experts to discuss your specific concerns before marriage.' }
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

            <ConnectExpertCTA variant="dark" text="Have a Dosha in your chart? Get remedies and a full reading from an expert astrologer." />

            <Footer />
        </div>
    );
};

export default ManglikChecker;
