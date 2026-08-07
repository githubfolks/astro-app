import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import FreeToolResult from '../../components/FreeToolResult';
import ConnectExpertCTA from '../../components/ConnectExpertCTA';
import PageHeading from '../../components/PageHeading';
import CityAutocomplete from '../../components/CityAutocomplete';
import { api } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { TOOL_INPUT_CLASS, TOOL_LABEL_CLASS, TOOL_BUTTON_CLASS, TOOL_ERROR_CLASS } from '../../utils/toolFormStyles';
import '../services/ServicesDetail.css';

interface VargaPlanet {
    planet?: string;
    sign?: string;
    sign_id?: number;
}

const VARGA_NAMES: Record<string, string> = {
    D1: 'Rashi (D1) — Birth Chart',
    D2: 'Hora (D2) — Wealth',
    D3: 'Drekkana (D3) — Siblings',
    D7: 'Saptamsha (D7) — Children',
    D9: 'Navamsa (D9) — Marriage & Dharma',
    D10: 'Dashamsha (D10) — Career',
    D12: 'Dwadashamsha (D12) — Parents',
    D16: 'Shodashamsha (D16) — Vehicles',
    D20: 'Vimshamsha (D20) — Spirituality',
    D24: 'Chaturvimshamsha (D24) — Education',
    D30: 'Trimshamsha (D30) — Misfortunes',
    D60: 'Shashtiamsha (D60) — Past Karma',
};

// Renders the FreeAstroAPI vargas payload ({ vargas: { D1: [...], D9: [...], ... } })
// as per-chart planet/sign grids, with D9 (the whole point of this page) featured
// first — falls back to the generic renderer for any other shape.
const NavamsaResult: React.FC<{ data: unknown }> = ({ data }) => {
    const obj = data && typeof data === 'object' ? (data as { vargas?: Record<string, VargaPlanet[]> }) : null;
    const vargas = obj?.vargas;

    if (!vargas || Object.keys(vargas).length === 0) return <FreeToolResult data={data} />;

    const orderedKeys = Object.keys(vargas).sort((a, b) => (a === 'D9' ? -1 : b === 'D9' ? 1 : 0));

    return (
        <div className="space-y-4">
            {orderedKeys.map((key) => {
                const planets = vargas[key];
                if (!Array.isArray(planets) || planets.length === 0) return null;
                const isD9 = key === 'D9';
                return (
                    <div key={key} className={`service-glass-panel p-6 ${isD9 ? 'border-l-4 border-l-amber-500' : ''}`}>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isD9 ? 'text-amber-400' : 'text-gray-400'}`}>
                            {VARGA_NAMES[key] || key}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {planets.map((p, idx) => (
                                <div key={idx} className="bg-white/5 rounded-xl border border-white/10 px-3 py-2 flex items-center justify-between">
                                    <span className="text-gray-300 text-sm">{p.planet}</span>
                                    <span className="text-white text-sm font-medium">{p.sign}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const NavamsaViewer: React.FC = () => {
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

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Free Navamsa (D9) Chart Viewer | Aadikarta Vedic Astrology",
        "applicationCategory": "SpiritualApplication",
        "operatingSystem": "Web",
        "description": "Generate your free Navamsa (D9) divisional chart online for marriage and relationship insights.",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await api.freeTools.navamsa(formData);
            setResult(data.vargas_data);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to generate Navamsa chart');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Free Navamsa (D9) Chart Viewer | Aadikarta Vedic Astrology"
                description="Generate your free Navamsa (D9) divisional chart online, used for marriage timing and relationship insights, on Aadikarta Vedic Astrology."
                keywords="Navamsa chart free, D9 chart online, divisional chart Vedic astrology, marriage chart, Aadikarta Vedic Astrology"
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
                            title="Free Navamsa (D9) Chart"
                            subtitle="Enter your birth details to generate your Navamsa divisional chart, used for marriage and relationship insights."
                        />
                </div>
            </header>
             <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                <div className="max-w-4xl mx-auto">
                    <div className="service-glass-panel p-6">
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
                                {loading ? (<><Loader2 size={18} className="animate-spin" /> Generating...</>) : (<>🪷 Generate Navamsa Chart</>)}
                            </button>
                        </form>
                    </div>

                    {result !== null ? (
                        <div ref={resultRef} className="mt-8 scroll-mt-24">
                            <h2 className="text-lg font-normal text-white mb-4">Your Navamsa (D9) Chart</h2>
                            <NavamsaResult data={result} />
                        </div>
                    ) : null}

                    <section className="mt-16 service-glass-panel p-8">
                        <h2 className="text-2xl font-normal text-white mb-4">Why the Navamsa Chart Matters</h2>
                        <div className="space-y-3 text-gray-300 leading-relaxed">
                            <p>
                                The Navamsa (D9) is a divisional chart derived by splitting each sign of your birth chart into nine parts. Often called the "second most important chart" in Vedic astrology, it's used specifically to study marriage, spouse, and the strength of planets in your later life.
                            </p>
                            <p>
                                Where your main birth chart shows the broad picture, the Navamsa refines it — a planet that looks weak in the birth chart can turn out strong here, and vice versa, which is why astrologers read both together rather than either alone.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <ConnectExpertCTA variant="dark" text="Want your Navamsa read alongside your full birth chart? Talk to an expert astrologer." />

            <Footer />
        </div>
    );
};

export default NavamsaViewer;
