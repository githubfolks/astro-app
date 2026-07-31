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

const ManglikChecker: React.FC = () => {
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
        "name": "Free Manglik Dosha Checker | Aadikarta Vedic Astrology",
        "applicationCategory": "SpiritualApplication",
        "operatingSystem": "Web",
        "description": "Check Manglik Dosha and other Vedic yogas in your birth chart for free.",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
    };

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

            <main className="container mx-auto p-4 md:p-6 pt-10">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-normal text-white">🔴 Free Manglik Dosha Checker</h1>
                        <p className="text-gray-300 mt-2">Enter your birth details to check for Manglik (Mangal) Dosha and other yogas in your chart.</p>
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
                                {loading ? (<><Loader2 size={18} className="animate-spin" /> Checking...</>) : (<>🔴 Check Manglik Dosha</>)}
                            </button>
                        </form>
                    </div>

                    {result !== null ? (
                        <div className="mt-8">
                            <h2 className="text-lg font-normal text-white mb-4">Your Yogas & Doshas</h2>
                            <FreeToolResult data={result} />
                        </div>
                    ) : null}

                    <section className="mt-16 service-glass-panel p-8">
                        <h2 className="text-2xl font-normal text-white mb-4">Why Manglik Dosha Matters</h2>
                        <div className="space-y-3 text-gray-300 leading-relaxed">
                            <p>
                                Manglik (or Mangal/Kuja) Dosha occurs when Mars is placed in certain houses of a birth chart. In Vedic tradition it's considered significant for marriage compatibility, since it's believed to influence temperament and harmony between spouses.
                            </p>
                            <p>
                                Checking for it early — ideally before marriage discussions get serious — lets both families understand the chart clearly and, if needed, look at remedies or matching with another Manglik chart, rather than treating it as an unexplained obstacle later.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <ConnectExpertCTA variant="dark" text="Have a Dosha in your chart? Get remedies and a full reading from an expert astrologer." />

            <Footer />
        </div>
    );
};

export default ManglikChecker;
