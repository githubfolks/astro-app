import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import FreeToolResult from '../../components/FreeToolResult';
import ConnectExpertCTA from '../../components/ConnectExpertCTA';
import PageHeading from '../../components/PageHeading';
import { api } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { TOOL_INPUT_CLASS, TOOL_LABEL_CLASS, TOOL_BUTTON_CLASS, TOOL_ERROR_CLASS } from '../../utils/toolFormStyles';
import '../services/ServicesDetail.css';

interface NumberFact {
    label?: string;
    value?: number;
    value_display?: string;
    age_start?: number;
    age_end_exclusive?: number;
}

const ageRangeLabel = (e: NumberFact): string | null => {
    if (e.age_start === undefined) return null;
    return e.age_end_exclusive !== undefined ? `Age ${e.age_start}–${e.age_end_exclusive}` : `Age ${e.age_start}+`;
};

const NumberRow: React.FC<{ item: NumberFact }> = ({ item }) => (
    <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-3 flex items-center justify-between">
        <div>
            <span className="text-white text-sm font-medium">{item.label}</span>
            {ageRangeLabel(item) && <span className="text-gray-500 text-xs ml-2">{ageRangeLabel(item)}</span>}
        </div>
        <span className="text-amber-400 font-normal">{item.value_display || item.value}</span>
    </div>
);

// Renders the FreeAstroAPI numerology profile payload — a deeply nested
// { data: { core, cycles, life_cycles } } structure — as headline stat tiles
// plus grouped lists, since the raw JSON is unreadable to end users. Falls
// back to the generic renderer for any other shape.
const NumerologyResult: React.FC<{ data: unknown }> = ({ data }) => {
    const obj = data && typeof data === 'object' ? (data as {
        data?: {
            core?: { life_path?: NumberFact; birthday?: NumberFact; attitude?: NumberFact };
            cycles?: { personal_year?: NumberFact; personal_month?: NumberFact; personal_day?: NumberFact };
            life_cycles?: { period_cycles?: NumberFact[]; pinnacles?: NumberFact[]; challenges?: NumberFact[] };
        };
    }) : null;
    const core = obj?.data?.core;

    if (!core) return <FreeToolResult data={data} />;

    const cycles = obj?.data?.cycles;
    const cycleEntries = [cycles?.personal_year, cycles?.personal_month, cycles?.personal_day].filter(
        (e): e is NumberFact => !!e
    );
    const lifeCycles = obj?.data?.life_cycles;

    return (
        <div className="space-y-4">
            {core.life_path && (
                <div className="service-glass-panel p-6 md:p-8 border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-5">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl font-normal">
                            {core.life_path.value}
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Life Path Number</span>
                            <h3 className="text-2xl font-normal text-amber-400 mt-1">{core.life_path.value_display || core.life_path.value}</h3>
                        </div>
                    </div>
                </div>
            )}

            {(core.birthday || core.attitude) && (
                <div className="grid grid-cols-2 gap-3">
                    {[core.birthday, core.attitude].filter((e): e is NumberFact => !!e).map((item, idx) => (
                        <div key={idx} className="bg-white/5 rounded-2xl border border-white/10 p-5 text-center">
                            <span className="block text-2xl font-normal text-white mb-1">{item.value}</span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {cycleEntries.length > 0 && (
                <div className="service-glass-panel p-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Current Cycles</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {cycleEntries.map((item, idx) => (
                            <div key={idx} className="text-center">
                                <span className="block text-xl font-normal text-white">{item.value}</span>
                                <span className="text-xs text-gray-400">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {lifeCycles?.period_cycles && lifeCycles.period_cycles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Life Period Cycles</h4>
                    {lifeCycles.period_cycles.map((item, idx) => <NumberRow key={idx} item={item} />)}
                </div>
            )}

            {lifeCycles?.pinnacles && lifeCycles.pinnacles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Pinnacles</h4>
                    {lifeCycles.pinnacles.map((item, idx) => <NumberRow key={idx} item={item} />)}
                </div>
            )}

            {lifeCycles?.challenges && lifeCycles.challenges.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Challenges</h4>
                    {lifeCycles.challenges.map((item, idx) => <NumberRow key={idx} item={item} />)}
                </div>
            )}
        </div>
    );
};

const NumerologyCalculator: React.FC = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<unknown>(null);

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Free Numerology Calculator | Aadikarta Vedic Astrology",
        "applicationCategory": "SpiritualApplication",
        "operatingSystem": "Web",
        "description": "Calculate your free numerology profile online using just your name and date of birth.",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await api.freeTools.numerology(formData);
            setResult(data.profile_data);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to generate numerology profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Free Numerology Calculator | Aadikarta Vedic Astrology"
                description="Calculate your free numerology profile with just your name and date of birth on Aadikarta Vedic Astrology. No birth time or place needed."
                keywords="free numerology calculator, life path number, name numerology, numerology profile online, Aadikarta Vedic Astrology"
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
                        title="Free Numerology Calculator"
                        subtitle="Enter your name and date of birth to calculate your numerology profile — no birth time or place needed."
                    />
                </div>
            </header>
            <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                <div className="max-w-4xl mx-auto">
                    <div className="service-glass-panel p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className={TOOL_LABEL_CLASS}>Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    autoComplete="off"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className={TOOL_INPUT_CLASS}
                                    placeholder="Enter your full name"
                                />
                            </div>
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

                            {error && (
                                <div className={TOOL_ERROR_CLASS}>{error}</div>
                            )}

                            <button type="submit" disabled={loading} className={TOOL_BUTTON_CLASS}>
                                {loading ? (<><Loader2 size={18} className="animate-spin" /> Calculating...</>) : (<>🔢 Calculate Numerology</>)}
                            </button>
                        </form>
                    </div>

                    {result !== null ? (
                        <div className="mt-8">
                            <h2 className="text-lg font-normal text-white mb-4">Your Numerology Profile</h2>
                            <NumerologyResult data={result} />
                        </div>
                    ) : null}

                    <section className="mt-16 service-glass-panel p-8">
                        <h2 className="text-2xl font-normal text-white mb-4">Why Numerology Matters</h2>
                        <div className="space-y-3 text-gray-300 leading-relaxed">
                            <p>
                                Numerology reduces your name and date of birth to a set of core numbers — like your Life Path number — each believed to carry its own personality traits, strengths, and challenges. It's a system many people use alongside astrology to understand themselves and time decisions.
                            </p>
                            <p>
                                People commonly turn to it for career direction, understanding compatibility with a partner, or even choosing an auspicious spelling of a name for a business or a newborn.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <ConnectExpertCTA variant="dark" text="Want your numerology combined with a full astrology reading? Talk to an expert." />

            <Footer />
        </div>
    );
};

export default NumerologyCalculator;
