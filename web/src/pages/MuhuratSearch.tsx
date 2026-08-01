import type { MuhuratSearchRecord, MuhuratWindow } from '../types';
import { getErrorMessage } from '../utils/errors';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';
import { ArrowLeft, Loader2, Search, Clock, AlertTriangle, CheckCircle2, Pencil, Trash2, X } from 'lucide-react';
import SEO from '../components/SEO';
import './services/ServicesDetail.css';

const INPUT_CLASS = "w-full border border-white/10 rounded-xl px-4 py-2.5 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm";
const LABEL_CLASS = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";

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
    auspicious: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    favorable: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    neutral: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    inauspicious: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const WindowCard: React.FC<{ w: MuhuratWindow }> = ({ w }) => (
    <div className={`p-3 rounded-xl border ${QUALITY_STYLES[w.quality] || 'bg-white/5 border-white/10 text-gray-300'}`}>
        <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">{new Date(w.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10">{w.score}/100</span>
        </div>
        <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
            <Clock size={12} /> {new Date(w.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {new Date(w.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {w.reasons && w.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
                {w.reasons.map((r, i) => (
                    <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 flex items-center gap-0.5">
                        <CheckCircle2 size={9} /> {r}
                    </span>
                ))}
            </div>
        )}
        {w.warnings && w.warnings.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
                {w.warnings.map((wr, i) => (
                    <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/10 flex items-center gap-0.5 text-amber-400">
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
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

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
            const payload = {
                purpose: purpose || undefined,
                start_date: startDate,
                end_date: endDate,
                place,
                subject: personalize
                    ? { date_of_birth: subjectDob, time_of_birth: subjectTob, place_of_birth: subjectPlace }
                    : undefined,
            };
            const data = editingId
                ? await api.muhurat.update(editingId, payload)
                : await api.muhurat.search(payload);
            setResult(data);
            setEditingId(null);
            loadHistory();
        } catch (err) {
            setError(getErrorMessage(err) || (editingId ? 'Failed to update Muhurat search' : 'Failed to search Muhurat'));
        } finally {
            setLoading(false);
        }
    };

    const handleEditHistoryReport = (h: MuhuratSearchRecord) => {
        setEditingId(h.id);
        setError(null);
        setResult(null);
        setPurpose(h.purpose || '');
        setStartDate(h.start_date || '');
        setEndDate(h.end_date || '');
        setPlace(h.place || '');
        setPersonalize(h.personalized);
        setSubjectDob(h.subject_date_of_birth || '');
        setSubjectTob(h.subject_time_of_birth || '');
        setSubjectPlace(h.subject_place_of_birth || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setError(null);
        setPurpose('');
        setStartDate('');
        setEndDate('');
        setPlace('');
        setPersonalize(false);
        setSubjectDob('');
        setSubjectTob('');
        setSubjectPlace('');
    };

    const handleDeleteHistoryReport = async (h: MuhuratSearchRecord) => {
        if (!window.confirm('Delete this Muhurat search? This cannot be undone.')) {
            return;
        }
        setDeletingId(h.id);
        try {
            await api.muhurat.delete(h.id);
            setHistory((prev) => prev.filter((r) => r.id !== h.id));
            if (editingId === h.id) {
                handleCancelEdit();
            }
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to delete Muhurat search');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Shubh Muhurat Finder & Auspicious Timings | Aadikarta Vedic Astrology"
                description="Search for auspicious Shubh Muhurat windows online with Aadikarta Vedic Astrology — personalized to your birth chart for marriage, travel, business, and events."
                keywords="Aadikarta Vedic Astrology, Shubh Muhurat finder, auspicious time calculator, online Muhurat search, birth chart Muhurat Aadikarta"
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

                <div className="max-w-5xl mx-auto flex gap-2 mb-2 text-xs font-semibold">
                    <Link to="/kundli" className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">Kundli Generator</Link>
                    <Link to="/kundli/matching" className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">Kundli Matching</Link>
                    <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500">Muhurat Search</span>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-normal text-white">🗓️ Muhurat Search</h1>
                        <p className="text-gray-300 mt-2">Find auspicious timing windows for seekers</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Search Form */}
                        <div className="service-glass-panel p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-normal text-white">
                                    {editingId ? 'Edit Search' : 'Search Parameters'}
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

                            <form onSubmit={handleSearch} className="space-y-4">
                                <div>
                                    <label className={LABEL_CLASS}>Purpose</label>
                                    <select
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        className={INPUT_CLASS}
                                    >
                                        {PURPOSES.map(p => <option key={p.value} value={p.value} className="bg-[#130c2c]">{p.label}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLASS}>Start Date *</label>
                                        <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                            className={INPUT_CLASS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>End Date *</label>
                                        <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                            className={INPUT_CLASS} />
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-500">Range cannot exceed 31 days.</p>
                                <div>
                                    <label className={LABEL_CLASS}>Place *</label>
                                    <input type="text" required value={place} onChange={(e) => setPlace(e.target.value)}
                                        placeholder="e.g., New Delhi, Delhi, India"
                                        className={INPUT_CLASS} />
                                </div>

                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                                    <input type="checkbox" checked={personalize} onChange={(e) => setPersonalize(e.target.checked)} />
                                    Personalize for a seeker's birth chart
                                </label>

                                {personalize && (
                                    <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                        <div>
                                            <label className={LABEL_CLASS}>Date of Birth *</label>
                                            <input type="date" required={personalize} autoComplete="off" value={subjectDob} onChange={(e) => setSubjectDob(e.target.value)}
                                                className={INPUT_CLASS} />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLASS}>Time of Birth *</label>
                                            <input type="time" required={personalize} step="1" autoComplete="off" value={subjectTob} onChange={(e) => setSubjectTob(e.target.value)}
                                                className={INPUT_CLASS} />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLASS}>Place of Birth *</label>
                                            <input type="text" required={personalize} autoComplete="off" value={subjectPlace} onChange={(e) => setSubjectPlace(e.target.value)}
                                                className={INPUT_CLASS} />
                                        </div>
                                    </div>
                                )}

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
                                        <><Loader2 size={18} className="animate-spin" /> {editingId ? 'Updating...' : 'Searching...'}</>
                                    ) : (
                                        <>🗓️ {editingId ? 'Update Search' : 'Search Muhurat'}</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Results / History */}
                        <div className="space-y-6">
                            {result && (
                                <div className="service-glass-panel p-6">
                                    <h2 className="text-lg font-normal text-white mb-4">
                                        {result.muhurat_data.best_windows.length} Window{result.muhurat_data.best_windows.length === 1 ? '' : 's'} Found
                                    </h2>
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                        {result.muhurat_data.best_windows.map((w, i) => <WindowCard key={i} w={w} />)}
                                    </div>
                                </div>
                            )}

                            <div className="service-glass-panel p-6">
                                <h2 className="text-lg font-normal text-white mb-4">Recent Searches</h2>
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
                                            <div
                                                key={h.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setResult(h)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') setResult(h); }}
                                                className="group relative w-full text-left bg-white/5 hover:bg-amber-500/10 p-3 pr-16 rounded-xl border border-white/10 hover:border-amber-500/30 transition-all cursor-pointer"
                                            >
                                                <div className="font-semibold text-white text-sm">
                                                    {PURPOSES.find(p => p.value === h.purpose)?.label || h.purpose || 'General'} · {h.place}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {h.start_date} – {h.end_date} {h.personalized ? '· Personalized' : ''}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-0.5">
                                                    Generated {new Date(h.created_at || "").toLocaleString()}
                                                </div>

                                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleEditHistoryReport(h); }}
                                                        title="Edit"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteHistoryReport(h); }}
                                                        disabled={deletingId === h.id}
                                                        title="Delete"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                                                    >
                                                        {deletingId === h.id ? (
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
                    </div>

                    <section className="max-w-3xl mx-auto mt-16 service-glass-panel p-8">
                        <h2 className="text-2xl font-normal text-white mb-4">Why Muhurat Matters</h2>
                        <div className="space-y-3 text-gray-300 leading-relaxed">
                            <p>
                                In Vedic tradition, every important life event — marriage, a housewarming (Griha Pravesh), starting a business, buying a vehicle, or a child's naming ceremony — is best begun at a Muhurat: a window of time when planetary positions are considered most favorable.
                            </p>
                            <p>
                                Starting something during an auspicious window is believed to align your effort with supportive cosmic energy, reducing obstacles and improving the odds of a smooth, successful outcome. Avoiding inauspicious periods like Rahu Kalam is just as important as choosing a good one.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MuhuratSearchPage;
