import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import FreeToolResult from '../../components/FreeToolResult';
import ConnectExpertCTA from '../../components/ConnectExpertCTA';
import { api } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { TOOL_INPUT_CLASS, TOOL_LABEL_CLASS, TOOL_BUTTON_CLASS, TOOL_ERROR_CLASS } from '../../utils/toolFormStyles';
import '../services/ServicesDetail.css';

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

            <main className="container mx-auto p-4 md:p-6 pt-10">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-normal text-white">🪷 Free Navamsa (D9) Chart</h1>
                        <p className="text-gray-300 mt-2">Enter your birth details to generate your Navamsa divisional chart, used for marriage and relationship insights.</p>
                    </div>

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
                                <input
                                    type="text"
                                    required
                                    value={formData.place_of_birth}
                                    onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                                    className={TOOL_INPUT_CLASS}
                                    placeholder="e.g., Delhi, Mumbai, Varanasi"
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
                        <div className="mt-8">
                            <h2 className="text-lg font-normal text-white mb-4">Your Navamsa (D9) Chart</h2>
                            <FreeToolResult data={result} />
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
