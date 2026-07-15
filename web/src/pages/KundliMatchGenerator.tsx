import type { MatchReport } from '../types';
import { getErrorMessage } from '../utils/errors';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MatchContent } from '../components/MatchPanel';
import { api } from '../services/api';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import SEO from '../components/SEO';

interface PersonForm {
    full_name: string;
    date_of_birth: string;
    time_of_birth: string;
    place_of_birth: string;
}

const emptyPerson: PersonForm = { full_name: '', date_of_birth: '', time_of_birth: '', place_of_birth: '' };

const PersonFields: React.FC<{ title: string; value: PersonForm; onChange: (v: PersonForm) => void }> = ({ title, value, onChange }) => (
    <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Full Name</label>
            <input
                type="text"
                autoComplete="off"
                value={value.full_name}
                onChange={(e) => onChange({ ...value, full_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                placeholder="Enter name"
            />
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Date of Birth *</label>
            <input
                type="date"
                required
                autoComplete="off"
                value={value.date_of_birth}
                onChange={(e) => onChange({ ...value, date_of_birth: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
            />
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Time of Birth *</label>
            <input
                type="time"
                required
                step="1"
                autoComplete="off"
                value={value.time_of_birth}
                onChange={(e) => onChange({ ...value, time_of_birth: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
            />
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Place of Birth *</label>
            <input
                type="text"
                required
                autoComplete="off"
                value={value.place_of_birth}
                onChange={(e) => onChange({ ...value, place_of_birth: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                placeholder="e.g., Delhi, Mumbai, Varanasi"
            />
        </div>
    </div>
);

const KundliMatchGenerator: React.FC = () => {
    const navigate = useNavigate();

    const [boy, setBoy] = useState<PersonForm>(emptyPerson);
    const [girl, setGirl] = useState<PersonForm>(emptyPerson);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<MatchReport | null>(null);

    const [history, setHistory] = useState<MatchReport[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const data = await api.matching.getHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load Match history', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const result = await api.matching.generate({ boy, girl });
            setReport(result);
            loadHistory();
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to generate Match report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <SEO
                title="Kuta Matching (Guna Milan) | Astrologer Tool"
                description="Generate a Kuta (Guna Milan) compatibility report between two birth charts."
            />
            <Header />

            <main className="flex-1 container mx-auto p-4 md:p-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-[#E91E63] transition-colors font-medium w-fit"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="max-w-5xl mx-auto flex gap-2 mb-2 text-xs font-semibold">
                    <Link to="/kundli" className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">Kundli Generator</Link>
                    <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">Kundli Matching</span>
                    <Link to="/kundli/muhurat" className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">Muhurat Search</Link>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">💞 Kundli Matching</h1>
                        <p className="text-gray-900 mt-2">Generate Kuta (Guna Milan) compatibility reports for seekers</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Generate Form */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <form onSubmit={handleGenerate} className="space-y-6">
                                <PersonFields title="Boy" value={boy} onChange={setBoy} />
                                <div className="border-t border-gray-100" />
                                <PersonFields title="Girl" value={girl} onChange={setGirl} />

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
                                        <>💞 Generate Match Report</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Result / History */}
                        <div className="space-y-6">
                            {(loading || error || report) && (
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                    <MatchContent
                                        matchData={report?.match_data}
                                        boyName={report?.boy_full_name || boy.full_name || 'Boy'}
                                        girlName={report?.girl_full_name || girl.full_name || 'Girl'}
                                        loading={loading}
                                        error={error}
                                    />
                                </div>
                            )}

                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Match Reports</h2>

                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-8 text-gray-400">
                                        <Loader2 size={24} className="animate-spin" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Search size={40} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No Match reports yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {history.map((r: MatchReport) => (
                                            <button
                                                key={r.id}
                                                onClick={() => setReport(r)}
                                                className="w-full text-left bg-gray-50 hover:bg-purple-50 p-3 rounded-xl border border-gray-100 hover:border-purple-200 transition-all"
                                            >
                                                <div className="font-semibold text-gray-800 text-sm">
                                                    {(r.boy_full_name || 'Boy')} & {(r.girl_full_name || 'Girl')}
                                                </div>
                                                <div className="text-xs text-gray-900 mt-1">
                                                    {r.match_data?.ashtakoota?.score}/{r.match_data?.ashtakoota?.max_score} · {r.match_data?.ashtakoota?.recommendation}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    Generated {new Date(r.created_at || "").toLocaleString()}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default KundliMatchGenerator;
