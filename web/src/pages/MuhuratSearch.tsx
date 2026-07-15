import type { MuhuratSearchRecord, MuhuratWindow } from '../types';
import { getErrorMessage } from '../utils/errors';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';
import { ArrowLeft, Loader2, Search, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import SEO from '../components/SEO';

const PURPOSES = [
    { value: '', label: 'General' },
    { value: 'general_work', label: 'General Work' },
    { value: 'vehicle_purchase', label: 'Vehicle Purchase' },
    { value: 'property_purchase', label: 'Property Purchase' },
    { value: 'griha_pravesh', label: 'Griha Pravesh (Housewarming)' },
    { value: 'namkaran', label: 'Namkaran (Naming Ceremony)' },
    { value: 'mundan', label: 'Mundan (Tonsure)' },
];

const QUALITY_STYLES: Record<string, string> = {
    auspicious: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    favorable: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral: 'bg-amber-50 text-amber-700 border-amber-200',
    inauspicious: 'bg-red-50 text-red-700 border-red-200',
};

const WindowCard: React.FC<{ w: MuhuratWindow }> = ({ w }) => (
    <div className={`p-3 rounded-xl border ${QUALITY_STYLES[w.quality] || 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">{new Date(w.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/70">{w.score}/100</span>
        </div>
        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
            <Clock size={12} /> {new Date(w.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(w.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {w.reasons && w.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
                {w.reasons.map((r, i) => (
                    <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/70 flex items-center gap-0.5">
                        <CheckCircle2 size={9} /> {r}
                    </span>
                ))}
            </div>
        )}
        {w.warnings && w.warnings.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
                {w.warnings.map((wr, i) => (
                    <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/50 flex items-center gap-0.5 text-amber-700">
                        <AlertTriangle size={9} /> {wr}
                    </span>
                ))}
            </div>
        )}
    </div>
);

const MuhuratSearchPage: React.FC = () => {
    const navigate = useNavigate();

    const [purpose, setPurpose] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [place, setPlace] = useState('');
    const [personalize, setPersonalize] = useState(false);
    const [subjectDob, setSubjectDob] = useState('');
    const [subjectTob, setSubjectTob] = useState('');
    const [subjectPlace, setSubjectPlace] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MuhuratSearchRecord | null>(null);

    const [history, setHistory] = useState<MuhuratSearchRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const data = await api.muhurat.getHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load Muhurat history', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await api.muhurat.search({
                purpose: purpose || undefined,
                start_date: startDate,
                end_date: endDate,
                place,
                subject: personalize
                    ? { date_of_birth: subjectDob, time_of_birth: subjectTob, place_of_birth: subjectPlace }
                    : undefined,
            });
            setResult(data);
            loadHistory();
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to search Muhurat');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <SEO
                title="Muhurat Search | Astrologer Tool"
                description="Search for auspicious Muhurat windows, generic or personalized to a birth chart."
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
                    <Link to="/kundli/matching" className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">Kundli Matching</Link>
                    <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">Muhurat Search</span>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">🗓️ Muhurat Search</h1>
                        <p className="text-gray-900 mt-2">Find auspicious timing windows for seekers</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Search Form */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Purpose</label>
                                    <select
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                                    >
                                        {PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Start Date *</label>
                                        <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">End Date *</label>
                                        <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm" />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400">Range cannot exceed 31 days.</p>
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Place *</label>
                                    <input type="text" required value={place} onChange={(e) => setPlace(e.target.value)}
                                        placeholder="e.g., Delhi, Mumbai, Varanasi"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm" />
                                </div>

                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                                    <input type="checkbox" checked={personalize} onChange={(e) => setPersonalize(e.target.checked)} />
                                    Personalize for a seeker's birth chart
                                </label>

                                {personalize && (
                                    <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Date of Birth *</label>
                                            <input type="date" required={personalize} value={subjectDob} onChange={(e) => setSubjectDob(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Time of Birth *</label>
                                            <input type="time" required={personalize} step="1" value={subjectTob} onChange={(e) => setSubjectTob(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Place of Birth *</label>
                                            <input type="text" required={personalize} value={subjectPlace} onChange={(e) => setSubjectPlace(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm" />
                                        </div>
                                    </div>
                                )}

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
                                    {loading ? (<><Loader2 size={18} className="animate-spin" /> Searching...</>) : (<>🗓️ Search Muhurat</>)}
                                </button>
                            </form>
                        </div>

                        {/* Results / History */}
                        <div className="space-y-6">
                            {result && (
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                                        {result.muhurat_data.best_windows.length} Window{result.muhurat_data.best_windows.length === 1 ? '' : 's'} Found
                                    </h2>
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                        {result.muhurat_data.best_windows.map((w, i) => <WindowCard key={i} w={w} />)}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Searches</h2>
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-8 text-gray-400">
                                        <Loader2 size={24} className="animate-spin" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Search size={40} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No searches yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {history.map((h) => (
                                            <button
                                                key={h.id}
                                                onClick={() => setResult(h)}
                                                className="w-full text-left bg-gray-50 hover:bg-purple-50 p-3 rounded-xl border border-gray-100 hover:border-purple-200 transition-all"
                                            >
                                                <div className="font-semibold text-gray-800 text-sm">
                                                    {PURPOSES.find(p => p.value === h.purpose)?.label || h.purpose || 'General'} · {h.place}
                                                </div>
                                                <div className="text-xs text-gray-900 mt-1">
                                                    {h.start_date} – {h.end_date} {h.personalized ? '· Personalized' : ''}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    Generated {new Date(h.created_at || "").toLocaleString()}
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

export default MuhuratSearchPage;
