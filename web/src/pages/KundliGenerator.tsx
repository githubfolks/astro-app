import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import KundliPanel from '../components/KundliPanel';
import { api } from '../services/api';
import { ArrowLeft, Loader2, Search } from 'lucide-react';

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
    const [chartData, setChartData] = useState<any>(null);
    const [showPanel, setShowPanel] = useState(false);

    // History
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

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
            const result = await api.kundli.generate({
                full_name: formData.full_name,
                date_of_birth: formData.date_of_birth,
                time_of_birth: formData.time_of_birth,
                place_of_birth: formData.place_of_birth,
            });
            setChartData(result.chart_data);
            setShowPanel(true);
            loadHistory(); // Refresh history
        } catch (err: any) {
            setError(err.message || 'Failed to generate Kundli');
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistoryReport = async (report: any) => {
        setChartData(report.chart_data);
        setShowPanel(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <Header />

            <main className="flex-1 container mx-auto p-4 md:p-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-[#E91E63] transition-colors font-medium w-fit"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">🔮 Kundli Generator</h1>
                        <p className="text-gray-500 mt-2">Generate Vedic birth charts for seekers</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Generate Form */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Enter Birth Details</h2>

                            <form onSubmit={handleGenerate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                                        placeholder="Enter name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Date of Birth *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Time of Birth *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        step="1"
                                        value={formData.time_of_birth}
                                        onChange={(e) => setFormData({ ...formData, time_of_birth: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Place of Birth *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.place_of_birth}
                                        onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                                        placeholder="e.g., Delhi, Mumbai, Varanasi"
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-200">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>🔮 Generate Kundli</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* History */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Kundli Reports</h2>

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
                                    {history.map((report: any) => (
                                        <button
                                            key={report.id}
                                            onClick={() => handleViewHistoryReport(report)}
                                            className="w-full text-left bg-gray-50 hover:bg-purple-50 p-3 rounded-xl border border-gray-100 hover:border-purple-200 transition-all"
                                        >
                                            <div className="font-semibold text-gray-800 text-sm">
                                                {report.full_name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(report.date_of_birth).toLocaleDateString()} • {report.place_of_birth}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                Generated {new Date(report.created_at).toLocaleString()}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
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
