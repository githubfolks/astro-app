import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Loader2, HeartHandshake, ShieldCheck, Sparkles, Award, Users } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import ConnectExpertCTA from '../../components/ConnectExpertCTA';
import PageHeading from '../../components/PageHeading';
import FAQSection from '../../components/FAQSection';
import CityAutocomplete from '../../components/CityAutocomplete';
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';
import { MatchContent } from '../../components/MatchPanel';
import { api } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { TOOL_INPUT_CLASS, TOOL_LABEL_CLASS, TOOL_BUTTON_CLASS, TOOL_ERROR_CLASS } from '../../utils/toolFormStyles';
import type { MatchData } from '../../types';
import '../services/ServicesDetail.css';

interface PersonForm {
    full_name: string;
    date_of_birth: string;
    time_of_birth: string;
    place_of_birth: string;
}

const emptyPerson: PersonForm = { full_name: '', date_of_birth: '', time_of_birth: '', place_of_birth: '' };

const PersonFields: React.FC<{ title: string; value: PersonForm; onChange: (v: PersonForm) => void }> = ({ title, value, onChange }) => (
    <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-300">{title}</h3>
        <div>
            <label className={TOOL_LABEL_CLASS}>Full Name</label>
            <input
                type="text"
                autoComplete="off"
                value={value.full_name}
                onChange={(e) => onChange({ ...value, full_name: e.target.value })}
                className={TOOL_INPUT_CLASS}
                placeholder="Enter name"
            />
        </div>
        <div>
            <label className={TOOL_LABEL_CLASS}>Date of Birth *</label>
            <DatePicker
                required
                value={value.date_of_birth}
                onChange={(date_of_birth) => onChange({ ...value, date_of_birth })}
                className={TOOL_INPUT_CLASS}
            />
        </div>
        <div>
            <label className={TOOL_LABEL_CLASS}>Time of Birth *</label>
            <TimePicker
                required
                withSeconds
                value={value.time_of_birth}
                onChange={(time_of_birth) => onChange({ ...value, time_of_birth })}
                className={TOOL_INPUT_CLASS}
            />
        </div>
        <div>
            <label className={TOOL_LABEL_CLASS}>Place of Birth *</label>
            <CityAutocomplete
                required
                value={value.place_of_birth}
                onChange={(place_of_birth) => onChange({ ...value, place_of_birth })}
                className={TOOL_INPUT_CLASS}
                placeholder="e.g., New Delhi, Delhi, India"
                dropdownClassName="bg-[#1a1530] text-white divide-y divide-white/5"
            />
        </div>
    </div>
);

const faqs = [
    { question: 'What is Kuta (Guna Milan) matching?', answer: 'Kuta matching, also called Guna Milan, compares two birth charts across 8 categories (Kootas) covering temperament, health, and compatibility, scored out of 36 Gunas — a long-standing practice before marriage in Vedic tradition.' },
    { question: 'What score is considered a good match?', answer: 'Traditionally, 18 out of 36 is the minimum for marriage, 24–32 is considered good, and above 32 is excellent compatibility. But the score alone isn\'t the full picture — an astrologer also looks at which specific Kootas are weak and why.' },
    { question: 'What information do I need for both people?', answer: 'You need the exact date of birth, time of birth, and place of birth for both people. Since Moon sign and Nakshatra (used throughout the 8 Kootas) are sensitive to birth time, accuracy matters for a reliable score.' },
    { question: 'Is this Kuta matching tool free?', answer: 'Yes, this tool is completely free to use. For a deeper reading — including dosha analysis and remedies for a low score — you can connect with a verified astrologer on Aadikarta.' },
];

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebApplication",
            "name": "Free Kundli Matching (Guna Milan) Calculator | Aadikarta Vedic Astrology",
            "applicationCategory": "SpiritualApplication",
            "operatingSystem": "Web",
            "description": "Generate a free Kuta (Guna Milan) compatibility report between two birth charts.",
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

const KundliMatchChecker: React.FC = () => {
    useEffect(() => {
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    const [boy, setBoy] = useState<PersonForm>(emptyPerson);
    const [girl, setGirl] = useState<PersonForm>(emptyPerson);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (matchData !== null) {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [matchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMatchData(null);
        try {
            const data = await api.freeTools.kundliMatch({ boy, girl });
            setMatchData(data.match_data);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to generate Match report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Free Kundli Matching (Guna Milan) Calculator | Aadikarta Vedic Astrology"
                description="Generate a free Kuta (Guna Milan) compatibility report between two birth charts, instantly, on Aadikarta Vedic Astrology."
                keywords="free kundli matching, guna milan calculator, kundali milan free, marriage compatibility Vedic, Aadikarta Vedic Astrology"
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
                        title={<>Free <span className="text-amber-500">Kundli Matching</span></>}
                        subtitle="Enter both birth details to instantly generate a Kuta (Guna Milan) compatibility report."
                    />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 md:py-12 space-y-12 md:space-y-24">
                {/* Form + Result */}
                <div className="max-w-4xl mx-auto relative z-10" data-aos="fade-up">
                    <div className="service-glass-panel p-6 md:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <PersonFields title="Boy" value={boy} onChange={setBoy} />
                                <PersonFields title="Girl" value={girl} onChange={setGirl} />
                            </div>

                            {error && (
                                <div className={TOOL_ERROR_CLASS}>{error}</div>
                            )}

                            <button type="submit" disabled={loading} className={TOOL_BUTTON_CLASS}>
                                {loading ? (<><Loader2 size={18} className="animate-spin" /> Generating...</>) : (<><HeartHandshake size={16} /> Generate Match Report</>)}
                            </button>
                        </form>
                    </div>

                    {matchData !== null ? (
                        <div ref={resultRef} className="mt-8 scroll-mt-24" data-aos="fade-up">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="title-icon-wrapper"><Sparkles size={20} /></div>
                                <h2 className="text-xl font-normal text-white">Your Compatibility Report</h2>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <MatchContent
                                    matchData={matchData}
                                    boyName={boy.full_name || 'Boy'}
                                    girlName={girl.full_name || 'Girl'}
                                    loading={false}
                                    error={null}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Why it matters */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center" data-aos="fade-up">
                    <div>
                        <div className="flex items-center gap-3 mb-3 md:mb-6">
                            <div className="title-icon-wrapper"><HeartHandshake size={20} /></div>
                            <h2 className="text-2xl md:text-3xl font-normal text-white">Why Kundli Matching Matters</h2>
                        </div>
                        <div className="space-y-4 text-gray-300 text-base md:text-lg leading-relaxed">
                            <p>
                                Kundli Matching (Guna Milan) compares the birth charts of two people across 8 Kutas covering temperament, mental compatibility, health, and progeny — scored out of 36 points.
                            </p>
                            <p>
                                Beyond the score itself, matching also surfaces doshas — like Manglik Dosha — that a couple may want to understand and address together, so decisions around marriage are made with full information rather than surprises later.
                            </p>
                        </div>
                    </div>

                    <div className="service-glass-panel p-5 md:p-8" data-aos="fade-left">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Varna', desc: 'Work profile/ego' },
                                { label: 'Vashya', desc: 'Mutual control' },
                                { label: 'Tara', desc: 'Destiny/health' },
                                { label: 'Yoni', desc: 'Physical affinity' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center hover:border-amber-500/20 transition-all hover:-translate-y-0.5">
                                    <span className="block text-amber-500 font-normal text-base mb-1">{item.label}</span>
                                    <span className="text-xs text-gray-400 font-light">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-center text-xs text-amber-500/60 uppercase tracking-widest font-normal">The Pillars of Compatibility</div>
                    </div>
                </section>

                {/* How Aadikarta helps */}
                <section className="text-center py-5 md:py-10" data-aos="fade-up">
                    <h2 className="text-2xl md:text-3xl font-normal text-white mb-3 md:mb-6">How Aadikarta Astrologers Help You</h2>
                    <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto mb-6 md:mb-12">
                        A free score gives you a quick read — only an expert astrologer can interpret weak Kootas and suggest remedies.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        {[
                            { icon: <ShieldCheck size={24} />, title: 'Dosha Analysis', desc: 'Comprehensive checking for Manglik Dosha, Bhakoot Dosha, and Nadi Dosha.' },
                            { icon: <Award size={24} />, title: 'Remedial Solutions', desc: 'Personalized remedies including gemstones, mantras, and pujas to neutralize influences.' },
                            { icon: <Users size={24} />, title: 'Face-to-Face Clarity', desc: 'Direct interaction with verified Vedic experts to discuss specific concerns.' },
                            { icon: <HeartHandshake size={24} />, title: 'Holistic Prediction', desc: 'Going beyond simple scores to analyze both charts together in full context.' }
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

            <ConnectExpertCTA variant="dark" text="Want a full compatibility reading with remedies? Talk to an expert astrologer." />

            <Footer />
        </div>
    );
};

export default KundliMatchChecker;
