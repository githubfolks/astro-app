import type { MatchData, MatchKoota } from '../types';
import React from 'react';
import { Loader2, AlertCircle, HeartHandshake, ShieldAlert } from 'lucide-react';

interface MatchPanelProps {
    matchData?: MatchData | null;
    boyName?: string;
    girlName?: string;
    loading?: boolean;
    error?: string | null;
}

const STATUS_STYLES: Record<string, string> = {
    strong: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    weak: 'bg-amber-50 text-amber-700 border-amber-200',
    dosha: 'bg-red-50 text-red-700 border-red-200',
};

const KootaRow: React.FC<{ koota: MatchKoota }> = ({ koota }) => (
    <div className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border ${STATUS_STYLES[koota.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        <div className="min-w-0">
            <span className="text-xs font-semibold">{koota.name}</span>
            {koota.evidence?.[0]?.message && (
                <p className="text-[10px] opacity-75 mt-0.5 truncate">{koota.evidence[0].message}</p>
            )}
        </div>
        <span className="text-xs font-bold shrink-0">{koota.score}/{koota.max_score}</span>
    </div>
);

export const MatchContent: React.FC<MatchPanelProps> = ({ matchData, boyName = 'Boy', girlName = 'Girl', loading = false, error = null }) => {
    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-900 gap-3 py-16">
                <Loader2 size={40} className="animate-spin text-purple-600" />
                <p className="font-medium">Generating Match Report...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-200 max-w-sm">
                    <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                    <h3 className="font-bold text-red-800 mb-2">Failed to Generate Match Report</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!matchData) return null;

    const { ashtakoota, doshas, summary, persons } = matchData;

    return (
        <div className="space-y-6">
            {/* Score Header */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200 text-center">
                <div className="flex items-center justify-center gap-2 text-purple-700 mb-1">
                    <HeartHandshake size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">{boyName} & {girlName}</span>
                </div>
                <div className="text-4xl font-bold text-gray-900">
                    {ashtakoota.score}<span className="text-lg text-gray-400">/{ashtakoota.max_score}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{ashtakoota.recommendation} ({ashtakoota.percentage}%)</p>
                <p className={`text-xs font-semibold mt-2 ${summary.passes_minimum_threshold ? 'text-emerald-600' : 'text-red-600'}`}>
                    {summary.passes_minimum_threshold
                        ? `Meets traditional minimum (${summary.minimum_traditional_threshold}/36)`
                        : `Below traditional minimum (${summary.minimum_traditional_threshold}/36)`}
                </p>
                {summary.risk_flags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                        {summary.risk_flags.map(flag => (
                            <span key={flag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                <ShieldAlert size={10} /> {flag.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Moon Sign / Nakshatra */}
            {persons.length === 2 && (
                <div className="grid grid-cols-2 gap-3">
                    {persons.map((p, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{i === 0 ? boyName : girlName}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">{p.moon_sign.name}</p>
                            <p className="text-xs text-gray-500">{p.moon_nakshatra.name}, Pada {p.moon_nakshatra.pada}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Ashtakoota Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider p-4 pb-2">Ashtakoota Breakdown</h3>
                <div className="p-4 pt-1 space-y-2">
                    {ashtakoota.kootas.map(k => <KootaRow key={k.id} koota={k} />)}
                </div>
            </div>

            {/* Doshas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider p-4 pb-2">Dosha Analysis</h3>
                <div className="p-4 pt-1 space-y-3">
                    <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">Manglik Dosha</p>
                        <div className="grid grid-cols-2 gap-2">
                            <p className={`text-[11px] p-2 rounded-lg border ${doshas.manglik.person1.active ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                {boyName}: {doshas.manglik.person1.message}
                            </p>
                            <p className={`text-[11px] p-2 rounded-lg border ${doshas.manglik.person2.active ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                {girlName}: {doshas.manglik.person2.message}
                            </p>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1.5">{doshas.manglik.compatibility.message}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <p className={`text-[11px] p-2 rounded-lg border ${doshas.nadi.active ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                            Nadi: {doshas.nadi.message}
                        </p>
                        <p className={`text-[11px] p-2 rounded-lg border ${doshas.bhakoot.active ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                            Bhakoot: {doshas.bhakoot.message}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchContent;
