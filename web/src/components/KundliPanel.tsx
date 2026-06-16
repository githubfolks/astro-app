import React, { useState } from 'react';
import { X, Loader2, Star, AlertCircle } from 'lucide-react';
import KundliChart, { RASHI_NAMES_FULL, PLANET_SHORT, PLANET_COLORS } from './KundliChart';

interface KundliPanelProps {
    isOpen: boolean;
    onClose: () => void;
    chartData: any; // Full AstroAPI response
    seekerName?: string;
    loading?: boolean;
    error?: string | null;
}

const TABS = [
    { key: 'd1', label: 'Rashi (D1)' },
    { key: 'd9', label: 'Navamsa (D9)' },
    { key: 'd10', label: 'Dasamsa (D10)' },
];

const KundliPanel: React.FC<KundliPanelProps> = ({
    isOpen,
    onClose,
    chartData,
    seekerName = 'Seeker',
    loading = false,
    error = null,
}) => {
    const [activeTab, setActiveTab] = useState('d1');

    if (!isOpen) return null;

    const charts = chartData?.charts;
    const planets = chartData?.planets;
    const basicDetails = chartData?.basicDetails;
    const activeChart = charts?.[activeTab];

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            🔮 Kundli — {seekerName}
                        </h2>
                        <p className="text-purple-200 text-xs mt-0.5">Vedic Birth Chart Analysis</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
                        <Loader2 size={40} className="animate-spin text-purple-600" />
                        <p className="font-medium">Generating Kundli...</p>
                        <p className="text-sm text-gray-400">Calculating planetary positions...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 max-w-sm">
                            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                            <h3 className="font-bold text-red-800 mb-2">Failed to Generate Kundli</h3>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Chart Content */}
                {!loading && !error && chartData && (
                    <div className="flex-1 overflow-y-auto">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-all ${activeTab === tab.key
                                            ? 'text-purple-700 border-b-2 border-purple-700 bg-white'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Chart Visualization */}
                            <div className="flex justify-center">
                                <KundliChart
                                    chartData={activeChart}
                                    title={TABS.find(t => t.key === activeTab)?.label || 'Chart'}
                                    size={340}
                                />
                            </div>

                            {/* Basic Details */}
                            {basicDetails && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                    <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Star size={14} className="text-amber-600" />
                                        Basic Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {basicDetails.ayanamsha && (
                                            <DetailItem label="Ayanamsha" value={basicDetails.ayanamsha} />
                                        )}
                                        {basicDetails.tithi && (
                                            <DetailItem label="Tithi" value={basicDetails.tithi} />
                                        )}
                                        {basicDetails.yog && (
                                            <DetailItem label="Yog" value={basicDetails.yog} />
                                        )}
                                        {basicDetails.karan && (
                                            <DetailItem label="Karan" value={basicDetails.karan} />
                                        )}
                                        {basicDetails.vaara && (
                                            <DetailItem label="Vaara" value={basicDetails.vaara} />
                                        )}
                                        {basicDetails.nakshatra && (
                                            <DetailItem label="Nakshatra" value={basicDetails.nakshatra} />
                                        )}
                                        {basicDetails.sunrise && (
                                            <DetailItem label="Sunrise" value={basicDetails.sunrise} />
                                        )}
                                        {basicDetails.sunset && (
                                            <DetailItem label="Sunset" value={basicDetails.sunset} />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Planet Positions Table */}
                            {planets && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider p-4 pb-2">
                                        Planet Positions
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                                                    <th className="text-left p-3 font-semibold">Planet</th>
                                                    <th className="text-left p-3 font-semibold">Position</th>
                                                    <th className="text-left p-3 font-semibold">Nakshatra</th>
                                                    <th className="text-center p-3 font-semibold">R</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(planets).map(([name, data]: [string, any]) => {
                                                    const color = PLANET_COLORS[name] || '#333';
                                                    const short = PLANET_SHORT[name] || name;
                                                    return (
                                                        <tr key={name} className="border-t border-gray-100 hover:bg-gray-50">
                                                            <td className="p-3 font-semibold" style={{ color }}>
                                                                {short} <span className="text-gray-400 font-normal capitalize text-xs">({name})</span>
                                                            </td>
                                                            <td className="p-3 text-gray-700 font-mono text-xs">
                                                                {data.position || '—'}
                                                            </td>
                                                            <td className="p-3 text-gray-600 text-xs">
                                                                {data.nakshatra ? `Nak ${data.nakshatra[0]}, Pada ${data.nakshatra[1]}` : '—'}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                {data.retrograde ? (
                                                                    <span className="text-red-600 font-bold text-xs">R</span>
                                                                ) : (
                                                                    <span className="text-gray-300">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* House Details */}
                            {activeChart && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider p-4 pb-2">
                                        House Details
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 p-4 pt-2">
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(house => {
                                            const houseData = activeChart[house.toString()];
                                            if (!houseData) return null;
                                            const rashi = RASHI_NAMES_FULL[houseData.rashi] || `Rashi ${houseData.rashi}`;
                                            const housePlanets = houseData.planets || [];

                                            return (
                                                <div key={house} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 text-center">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">House {house}</div>
                                                    <div className="text-xs font-semibold text-indigo-700 mt-0.5">{rashi}</div>
                                                    {housePlanets.length > 0 && (
                                                        <div className="mt-1 flex flex-wrap justify-center gap-1">
                                                            {housePlanets.map((p: string) => (
                                                                <span
                                                                    key={p}
                                                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                                                    style={{
                                                                        color: PLANET_COLORS[p] || '#333',
                                                                        backgroundColor: `${PLANET_COLORS[p] || '#333'}15`
                                                                    }}
                                                                >
                                                                    {PLANET_SHORT[p] || p}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">{label}</span>
        <p className="text-sm text-gray-900 font-medium mt-0.5">{value}</p>
    </div>
);

export default KundliPanel;
