import type { MatchReport } from '../types';
import { getErrorMessage } from '../utils/errors';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MatchContent } from '../components/MatchPanel';
import CityAutocomplete from '../components/CityAutocomplete';
import { api } from '../services/api';
import { ArrowLeft, Loader2, Search, Pencil, Trash2, X } from 'lucide-react';
import SEO from '../components/SEO';
import './services/ServicesDetail.css';

const INPUT_CLASS = "w-full border border-white/10 rounded-xl px-4 py-2.5 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm";
const LABEL_CLASS = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";

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
            <label className={LABEL_CLASS}>Full Name</label>
            <input
                type="text"
                autoComplete="off"
                value={value.full_name}
                onChange={(e) => onChange({ ...value, full_name: e.target.value })}
                className={INPUT_CLASS}
                placeholder="Enter name"
            />
        </div>
        <div>
            <label className={LABEL_CLASS}>Date of Birth *</label>
            <input
                type="date"
                required
                autoComplete="off"
                value={value.date_of_birth}
                onChange={(e) => onChange({ ...value, date_of_birth: e.target.value })}
                className={INPUT_CLASS}
            />
        </div>
        <div>
            <label className={LABEL_CLASS}>Time of Birth *</label>
            <input
                type="time"
                required
                step="1"
                autoComplete="off"
                value={value.time_of_birth}
                onChange={(e) => onChange({ ...value, time_of_birth: e.target.value })}
                className={INPUT_CLASS}
            />
        </div>
        <div>
            <label className={LABEL_CLASS}>Place of Birth *</label>
            <CityAutocomplete
                required
                value={value.place_of_birth}
                onChange={(place_of_birth) => onChange({ ...value, place_of_birth })}
                className={INPUT_CLASS}
                placeholder="e.g., New Delhi, Delhi, India"
                dropdownClassName="bg-[#1a1530] text-white divide-y divide-white/5"
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
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

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
            const result = editingId
                ? await api.matching.update(editingId, { boy, girl })
                : await api.matching.generate({ boy, girl });
            setReport(result);
            setEditingId(null);
            setBoy(emptyPerson);
            setGirl(emptyPerson);
            loadHistory();
        } catch (err) {
            setError(getErrorMessage(err) || (editingId ? 'Failed to update Match report' : 'Failed to generate Match report'));
        } finally {
            setLoading(false);
        }
    };

    const handleEditHistoryReport = (r: MatchReport) => {
        setEditingId(r.id);
        setError(null);
        setReport(null);
        setBoy({
            full_name: r.boy_full_name || '',
            date_of_birth: r.boy_date_of_birth || '',
            time_of_birth: r.boy_time_of_birth || '',
            place_of_birth: r.boy_place_of_birth || '',
        });
        setGirl({
            full_name: r.girl_full_name || '',
            date_of_birth: r.girl_date_of_birth || '',
            time_of_birth: r.girl_time_of_birth || '',
            place_of_birth: r.girl_place_of_birth || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setError(null);
        setBoy(emptyPerson);
        setGirl(emptyPerson);
    };

    const handleDeleteHistoryReport = async (r: MatchReport) => {
        if (!window.confirm(`Delete the Match report for ${r.boy_full_name || 'Boy'} & ${r.girl_full_name || 'Girl'}? This cannot be undone.`)) {
            return;
        }
        setDeletingId(r.id);
        try {
            await api.matching.delete(r.id);
            setHistory((prev) => prev.filter((h) => h.id !== r.id));
            if (editingId === r.id) {
                handleCancelEdit();
            }
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to delete Match report');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Kuta Matching (Guna Milan) Calculator | Aadikarta Vedic Astrology"
                description="Generate a detailed Kuta (Guna Milan) compatibility report between two birth charts on Aadikarta Vedic Astrology."
                keywords="Aadikarta Vedic Astrology, Guna Milan calculator, Kuta matching online, Kundali milan calculator, marriage compatibility Aadikarta"
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
                    <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500">Kundli Matching</span>
                    <Link to="/muhurat" className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">Live Hora & Muhurat</Link>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-4 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-normal text-white">💞 Kundli Matching</h1>
                        <p className="text-gray-300 mt-2">Generate Kuta (Guna Milan) compatibility reports for seekers</p>
                    </div>

                    <div className="space-y-6">
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

                            <form onSubmit={handleGenerate} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <PersonFields title="Boy" value={boy} onChange={setBoy} />
                                    <PersonFields title="Girl" value={girl} onChange={setGirl} />
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
                                        <>💞 {editingId ? 'Update Match Report' : 'Generate Match Report'}</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Result */}
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

                        {/* History */}
                        <div className="service-glass-panel p-6">
                            <h2 className="text-lg font-normal text-white mb-4">Recent Match Reports</h2>

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
                                <div className="grid md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                                    {history.map((r: MatchReport) => (
                                        <div
                                            key={r.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setReport(r)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') setReport(r); }}
                                            className="group relative w-full text-left bg-white/5 hover:bg-amber-500/10 p-3 pr-16 rounded-xl border border-white/10 hover:border-amber-500/30 transition-all cursor-pointer"
                                        >
                                            <div className="font-semibold text-white text-sm">
                                                {(r.boy_full_name || 'Boy')} & {(r.girl_full_name || 'Girl')}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {r.match_data?.ashtakoota?.score}/{r.match_data?.ashtakoota?.max_score} · {r.match_data?.ashtakoota?.recommendation}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                Generated {new Date(r.created_at || "").toLocaleString()}
                                            </div>

                                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleEditHistoryReport(r); }}
                                                    title="Edit"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteHistoryReport(r); }}
                                                    disabled={deletingId === r.id}
                                                    title="Delete"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === r.id ? (
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
                        <h2 className="text-xl md:text-2xl font-normal text-white mb-4">Why Kundli Matching Matters</h2>
                        <div className="space-y-3 text-gray-300 leading-relaxed">
                            <p>
                                Kundli Matching (Guna Milan) compares the birth charts of two people across 8 Kutas covering temperament, mental compatibility, health, and progeny — scored out of 36 points. It's a long-standing practice before marriage in Indian families, meant to gauge how naturally two people are likely to get along.
                            </p>
                            <p>
                                Beyond the score itself, matching also surfaces doshas — like Manglik Dosha — that a couple may want to understand and address together, so decisions around marriage are made with full information rather than surprises later.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default KundliMatchGenerator;
