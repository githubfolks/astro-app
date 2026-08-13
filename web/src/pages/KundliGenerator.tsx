import type { ChartData, KundliReport } from '../types';
import { getErrorMessage } from '../utils/errors';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import KundliPanel from '../components/KundliPanel';
import CityAutocomplete from '../components/CityAutocomplete';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import { api } from '../services/api';
import { ArrowLeft, Loader2, Search, Pencil, Trash2, X } from 'lucide-react';

import SEO from '../components/SEO';
import './services/ServicesDetail.css';

const INPUT_CLASS = "w-full border border-white/10 rounded-xl px-4 py-2.5 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm";
const LABEL_CLASS = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";

const KundliGenerator: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        time_of_birth: '',
        place_of_birth: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [showPanel, setShowPanel] = useState(false);

    // History
    const [history, setHistory] = useState<KundliReport[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Aadikarta Vedic Astrology Free Kundli Generator",
        "applicationCategory": "SpiritualApplication",
        "operatingSystem": "Web",
        "description": "Generate accurate Vedic Kundli and birth charts online with Aadikarta Vedic Astrology's free online Kundli generator.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const data = await api.kundli.getHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load Kundli history', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                full_name: formData.full_name,
                date_of_birth: formData.date_of_birth,
                time_of_birth: formData.time_of_birth,
                place_of_birth: formData.place_of_birth,
            };
            const result = editingId
                ? await api.kundli.update(editingId, payload)
                : await api.kundli.generate(payload);
            setChartData(result.chart_data);
            setShowPanel(true);
            setEditingId(null);
            setFormData({ full_name: '', date_of_birth: '', time_of_birth: '', place_of_birth: '' });
            loadHistory(); // Refresh history
        } catch (err) {
            setError(getErrorMessage(err) || (editingId ? 'Failed to update Kundli' : 'Failed to generate Kundli'));
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistoryReport = async (report: KundliReport) => {
        setChartData(report.chart_data ?? null);
        setShowPanel(true);
    };

    const handleEditHistoryReport = (report: KundliReport) => {
        setEditingId(report.id);
        setError(null);
        setFormData({
            full_name: report.full_name || '',
            date_of_birth: report.date_of_birth || '',
            time_of_birth: report.time_of_birth || '',
            place_of_birth: report.place_of_birth || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setError(null);
        setFormData({ full_name: '', date_of_birth: '', time_of_birth: '', place_of_birth: '' });
    };

    const handleDeleteHistoryReport = async (report: KundliReport) => {
        if (!window.confirm(`Delete the Kundli report for ${report.full_name || 'this seeker'}? This cannot be undone.`)) {
            return;
        }
        setDeletingId(report.id);
        try {
            await api.kundli.delete(report.id);
            setHistory((prev) => prev.filter((r) => r.id !== report.id));
            if (editingId === report.id) {
                handleCancelEdit();
            }
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to delete Kundli report');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Free Janam Kundli Online (Birth Chart) | Aadikarta"
                description="Generate your free Janam Kundli (Vedic birth chart) online by date of birth. Calculate planetary positions, Dasha, Yogas & Lagna chart instantly with Aadikarta."
                keywords="Aadikarta Vedic Astrology, free Kundli generator, Janam Patrika online, Vedic birth chart, free online Kundli Aadikarta"
                structuredData={structuredData}
            />
            <Header />

            <main className="container mx-auto p-4 md:p-6 pt-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-4 flex items-center gap-2 text-gray-400 hover:text-amber-500 transition-colors font-medium w-fit"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="max-w-4xl mx-auto flex gap-2 mb-2 text-xs font-semibold">
                    <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500">Kundli Generator</span>
                    <Link to="/kundli/matching" className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">Kundli Matching</Link>
                    <Link to="/muhurat" className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">Live Hora & Muhurat</Link>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-4 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-normal text-white">🔮 Kundli Generator</h1>
                        <p className="text-gray-300 mt-2">Generate Vedic birth charts for seekers</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Generate Form */}
                        <div className="service-glass-panel p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-normal text-white">
                                    {editingId ? 'Edit Birth Details' : 'Enter Birth Details'}
                                </h2>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                        Cancel
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleGenerate} className="space-y-4">
                                <div>
                                    <label className={LABEL_CLASS}>
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className={INPUT_CLASS}
                                        placeholder="Enter name"
                                    />
                                </div>

                                <div>
                                    <label className={LABEL_CLASS}>
                                        Date of Birth *
                                    </label>
                                    <DatePicker
                                        required
                                        value={formData.date_of_birth}
                                        onChange={(date_of_birth) => setFormData({ ...formData, date_of_birth })}
                                        className={INPUT_CLASS}
                                    />
                                </div>

                                <div>
                                    <label className={LABEL_CLASS}>
                                        Time of Birth *
                                    </label>
                                    <TimePicker
                                        required
                                        withSeconds
                                        value={formData.time_of_birth}
                                        onChange={(time_of_birth) => setFormData({ ...formData, time_of_birth })}
                                        className={INPUT_CLASS}
                                    />
                                </div>

                                <div>
                                    <label className={LABEL_CLASS}>
                                        Place of Birth *
                                    </label>
                                    <CityAutocomplete
                                        required
                                        value={formData.place_of_birth}
                                        onChange={(place_of_birth) => setFormData({ ...formData, place_of_birth })}
                                        className={INPUT_CLASS}
                                        placeholder="e.g., New Delhi, Delhi, India"
                                        dropdownClassName="bg-[#1a1530] text-white divide-y divide-white/5"
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm border border-red-500/20">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:brightness-110 text-indigo-950 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            {editingId ? 'Updating...' : 'Generating...'}
                                        </>
                                    ) : (
                                        <>🔮 {editingId ? 'Update Kundli' : 'Generate Kundli'}</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* History */}
                        <div className="service-glass-panel p-6">
                            <h2 className="text-lg font-normal text-white mb-4">Recent Kundli Reports</h2>

                            {historyLoading ? (
                                <div className="flex items-center justify-center py-8 text-gray-400">
                                    <Loader2 size={24} className="animate-spin" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Search size={40} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No Kundli reports yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {history.map((report: KundliReport) => (
                                        <div
                                            key={report.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleViewHistoryReport(report)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleViewHistoryReport(report); }}
                                            className="group relative w-full text-left bg-white/5 hover:bg-amber-500/10 p-3 pr-16 rounded-xl border border-white/10 hover:border-amber-500/30 transition-all cursor-pointer"
                                        >
                                            <div className="font-semibold text-white text-sm">
                                                {report.full_name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(report.date_of_birth || "").toLocaleDateString()} • {report.place_of_birth}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                Generated {new Date(report.created_at || "").toLocaleString()}
                                            </div>

                                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleEditHistoryReport(report); }}
                                                    title="Edit"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteHistoryReport(report); }}
                                                    disabled={deletingId === report.id}
                                                    title="Delete"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === report.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <section className="mt-8 md:mt-16 service-glass-panel p-4 md:p-8">
                        <h2 className="text-xl md:text-2xl font-normal text-white mb-4">Why Your Kundli Matters</h2>
                        <div className="space-y-3 text-gray-300 leading-relaxed">
                            <p>
                                A Kundli (Janam Patrika) is a map of the sky at the exact moment you were born — the positions of the Sun, Moon, and planets across the twelve houses. In Vedic astrology, this chart is treated as a blueprint of your personality, strengths, and the broad timing of major life events.
                            </p>
                            <p>
                                It's the foundation almost every other Vedic reading builds on — from marriage compatibility and career timing to identifying doshas and the planetary periods (Dashas) currently shaping your life. Most people generate their Kundli once and refer back to it whenever they need guidance on a big decision.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />

            <KundliPanel
                isOpen={showPanel}
                onClose={() => setShowPanel(false)}
                chartData={chartData}
                seekerName={formData.full_name || 'Seeker'}
                loading={loading}
                error={error}
            />
        </div>
    );
};

export default KundliGenerator;
