import type { ChartData, DivisionChart, PlanetPosition } from '../types';
import React, { useState } from 'react';
import { X, Loader2, Star, AlertCircle, Clock, Sparkles, Gauge } from 'lucide-react';
import KundliChart, { PLANET_SHORT, PLANET_COLORS } from './KundliChart';
import {
    type Lang, hi,
    PLANET_NAME_HI, RASHI_HI, NAKSHATRA_HI, TITHI_HI, PANCHANG_YOGA_HI,
    WEEKDAY_HI, PAKSHA_HI, LUNAR_MONTH_HI, YOGA_NAME_HI, STRENGTH_HI,
    DASHA_LEVEL_HI, UI_HI,
} from '../utils/kundliHindi';
import { isExalted, isDebilitated, computeCombustSet, computeVargottamaSet } from '../utils/planetDignity';

interface KundliPanelProps {
    isOpen: boolean;
    onClose: () => void;
    chartData?: ChartData | null; // Full FreeAstroAPI /vedic/calculate response
    seekerName?: string;
    loading?: boolean;
    error?: string | null;
}

const TABS = [
    { key: 'D1', label: 'Rashi (D1)', labelHi: 'राशि (D1)' },
    { key: 'D9', label: 'Navamsa (D9)', labelHi: 'नवांश (D9)' },
    { key: 'D10', label: 'Dasamsa (D10)', labelHi: 'दशांश (D10)' },
];

interface KundliContentProps {
    chartData?: ChartData | null;
    loading?: boolean;
    error?: string | null;
}

function getDivisionChart(chartData: ChartData, tab: string): DivisionChart | undefined {
    if (tab === 'D1') return chartData.chart;
    return chartData.vargas?.vargas?.[tab];
}

/** The chart tabs, visualization and detail tables — no overlay/header, so it can be
 * embedded inline (e.g. in the astrologer chat sidebar) as well as inside KundliPanel. */
export const KundliContent: React.FC<KundliContentProps> = ({
    chartData,
    loading = false,
    error = null,
}) => {
    const [activeTab, setActiveTab] = useState('D1');
    const [lang, setLang] = useState<Lang>('en');

    const activeChart = chartData ? getDivisionChart(chartData, activeTab) : undefined;
    const ascendant = activeChart?.ascendant;
    const panchang = chartData?.panchang;
    // Combustion needs Sun's real degree (only D1 carries degree data); Vargottama compares D1 vs D9 sign.
    // Both are planet-level facts, so they apply regardless of which division tab is active.
    const combustSet = computeCombustSet(chartData?.chart);
    const vargottamaSet = computeVargottamaSet(chartData?.chart, chartData?.vargas?.vargas?.D9);
    const activePeriods = chartData?.vimshottari_dasha?.active_periods;
    const yogas = chartData?.yogas;
    const shadbala = chartData?.shadbala;
    const ashtakavarga = chartData?.ashtakavarga;

    return (
        <>
            {/* Loading State */}
            {loading && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-900 gap-3">
                        <Loader2 size={40} className="animate-spin text-purple-600" />
                        <p className="font-medium">{lang === 'hi' ? UI_HI.generatingKundli : 'Generating Kundli...'}</p>
                        <p className="text-sm text-gray-400">{lang === 'hi' ? UI_HI.calculatingPositions : 'Calculating planetary positions...'}</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 max-w-sm">
                            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                            <h3 className="font-bold text-red-800 mb-2">{lang === 'hi' ? UI_HI.failedToGenerate : 'Failed to Generate Kundli'}</h3>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Chart Content */}
                {!loading && !error && chartData && (
                    <div className="flex-1 overflow-y-auto">
                        {/* Tab Switcher + Language Toggle */}
                        <div className="flex items-center border-b border-gray-200 bg-gray-50 shrink-0">
                            <div className="flex flex-1">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex-1 py-3 px-4 text-xs font-semibold transition-all ${activeTab === tab.key
                                                ? 'text-purple-700 border-b-2 border-purple-700 bg-white'
                                                : 'text-gray-900 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {lang === 'hi' ? tab.labelHi : tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1 mx-3 text-xs font-semibold">
                                <button
                                    onClick={() => setLang('en')}
                                    className={`px-3 py-1 rounded-full transition-colors ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-900 hover:text-gray-700'}`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLang('hi')}
                                    className={`px-3 py-1 rounded-full transition-colors ${lang === 'hi' ? 'bg-white text-[#E91E63] shadow-sm' : 'text-gray-900 hover:text-gray-700'}`}
                                >
                                    हि
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Chart Visualization */}
                            <div className="flex flex-col items-center gap-2">
                                <KundliChart
                                    chartData={activeChart}
                                    title={lang === 'hi' ? TABS.find(t => t.key === activeTab)?.labelHi || 'चार्ट' : TABS.find(t => t.key === activeTab)?.label || 'Chart'}
                                    size={340}
                                    lang={lang}
                                    combustSet={combustSet}
                                    vargottamaSet={vargottamaSet}
                                />
                                {ascendant && (
                                    <p className="text-xs text-gray-900">
                                        {lang === 'hi' ? UI_HI.lagna : 'Lagna'}: <span className="font-semibold text-gray-700">{hi(RASHI_HI, ascendant.sign, lang)}({ascendant.sign_id})</span>
                                        {ascendant.nakshatra && (
                                            <> · {hi(NAKSHATRA_HI, ascendant.nakshatra.name, lang)} {lang === 'hi' ? UI_HI.pada : 'Pada'} {ascendant.nakshatra.pada} ({lang === 'hi' ? UI_HI.lord : 'lord'} {hi(PLANET_NAME_HI, ascendant.nakshatra.lord, lang)})</>
                                        )}
                                    </p>
                                )}
                                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-gray-900 max-w-[340px]">
                                    <span><span className="text-red-600 font-bold">*</span> {lang === 'hi' ? UI_HI.legendRetrograde : 'Retrograde'}</span>
                                    <span><span className="text-amber-600 font-bold">^</span> {lang === 'hi' ? UI_HI.legendCombust : 'Combust'}</span>
                                    <span><span className="text-purple-700 font-bold">□</span> {lang === 'hi' ? UI_HI.legendVargottama : 'Vargottama'}</span>
                                    <span><span className="text-emerald-700 font-bold">↑</span> {lang === 'hi' ? UI_HI.legendExalted : 'Exalted'}</span>
                                    <span><span className="text-red-600 font-bold">↓</span> {lang === 'hi' ? UI_HI.legendDebilitated : 'Debilitated'}</span>
                                </div>
                            </div>

                            {/* Birth Panchang */}
                            {panchang && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                    <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Star size={14} className="text-amber-600" />
                                        {lang === 'hi' ? UI_HI.birthPanchang : 'Birth Panchang'}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {panchang.weekday && <DetailItem label={lang === 'hi' ? UI_HI.vaara : 'Vaara'} value={hi(WEEKDAY_HI, panchang.weekday.name, lang)} />}
                                        {panchang.tithi && <DetailItem label={lang === 'hi' ? UI_HI.tithi : 'Tithi'} value={`${hi(TITHI_HI, panchang.tithi.name, lang)} (${hi(PAKSHA_HI, panchang.tithi.paksha, lang)})`} />}
                                        {panchang.nakshatra && <DetailItem label={lang === 'hi' ? UI_HI.nakshatra : 'Nakshatra'} value={`${hi(NAKSHATRA_HI, panchang.nakshatra.name, lang)}, ${lang === 'hi' ? UI_HI.pada : 'Pada'} ${panchang.nakshatra.pada}`} />}
                                        {panchang.yoga && <DetailItem label={lang === 'hi' ? UI_HI.yoga : 'Yoga'} value={hi(PANCHANG_YOGA_HI, panchang.yoga.name, lang)} />}
                                        {panchang.lunar_month && <DetailItem label={lang === 'hi' ? UI_HI.lunarMonth : 'Lunar Month'} value={hi(LUNAR_MONTH_HI, panchang.lunar_month.name, lang)} />}
                                        {panchang.sunrise && <DetailItem label={lang === 'hi' ? UI_HI.sunrise : 'Sunrise'} value={panchang.sunrise} />}
                                        {panchang.sunset && <DetailItem label={lang === 'hi' ? UI_HI.sunset : 'Sunset'} value={panchang.sunset} />}
                                        {panchang.rahu_kalam && <DetailItem label={lang === 'hi' ? UI_HI.rahuKalam : 'Rahu Kalam'} value={`${panchang.rahu_kalam.start} – ${panchang.rahu_kalam.end}`} />}
                                    </div>
                                </div>
                            )}

                            {/* Planet Positions Table */}
                            {activeChart?.planets && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider p-4 pb-2">
                                        {lang === 'hi' ? UI_HI.planetPositions : 'Planet Positions'}
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-900 uppercase text-xs">
                                                    <th className="text-left p-3 font-semibold">{lang === 'hi' ? UI_HI.planet : 'Planet'}</th>
                                                    <th className="text-left p-3 font-semibold">{lang === 'hi' ? UI_HI.signHouse : 'Sign / House'}</th>
                                                    <th className="text-left p-3 font-semibold">{lang === 'hi' ? UI_HI.nakshatra : 'Nakshatra'}</th>
                                                    <th className="text-center p-3 font-semibold">{lang === 'hi' ? UI_HI.retrogradeAbbr : 'R'}</th>
                                                    <th className="text-center p-3 font-semibold">{lang === 'hi' ? UI_HI.status : 'Status'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeChart.planets.map((planet: PlanetPosition) => {
                                                    const key = planet.name.toLowerCase();
                                                    const color = PLANET_COLORS[key] || '#333';
                                                    const short = lang === 'hi' ? hi(PLANET_NAME_HI, planet.name, lang) : PLANET_SHORT[key] || planet.name;
                                                    const exalted = isExalted(planet.name, planet.sign);
                                                    const debilitated = isDebilitated(planet.name, planet.sign);
                                                    const combust = combustSet.has(planet.name);
                                                    const vargottama = vargottamaSet.has(planet.name);
                                                    return (
                                                        <tr key={planet.name} className="border-t border-gray-100 hover:bg-gray-50">
                                                            <td className="p-3 font-semibold" style={{ color }}>
                                                                {short} {lang !== 'hi' && <span className="text-gray-400 font-normal capitalize text-xs">({planet.name})</span>}
                                                            </td>
                                                            <td className="p-3 text-gray-700 font-mono text-xs">
                                                                {hi(RASHI_HI, planet.sign, lang)}({planet.sign_id}){planet.degree_in_sign !== undefined ? ` ${planet.degree_in_sign.toFixed(2)}°` : ''} · {lang === 'hi' ? UI_HI.house.charAt(0) : 'H'}{planet.house}
                                                            </td>
                                                            <td className="p-3 text-gray-600 text-xs">
                                                                {planet.nakshatra ? `${hi(NAKSHATRA_HI, planet.nakshatra, lang)}${planet.pada ? `, ${lang === 'hi' ? UI_HI.pada : 'Pada'} ${planet.pada}` : ''}` : '—'}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                {planet.is_retrograde ? (
                                                                    <span className="text-red-600 font-bold text-xs">{lang === 'hi' ? UI_HI.retrogradeAbbr : 'R'}</span>
                                                                ) : (
                                                                    <span className="text-gray-300">—</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-center text-xs font-bold whitespace-nowrap">
                                                                {combust && <span className="text-amber-600" title={lang === 'hi' ? UI_HI.legendCombust : 'Combust'}>^</span>}
                                                                {vargottama && <span className="text-purple-700 ml-1" title={lang === 'hi' ? UI_HI.legendVargottama : 'Vargottama'}>□</span>}
                                                                {exalted && <span className="text-emerald-700 ml-1" title={lang === 'hi' ? UI_HI.legendExalted : 'Exalted'}>↑</span>}
                                                                {debilitated && <span className="text-red-600 ml-1" title={lang === 'hi' ? UI_HI.legendDebilitated : 'Debilitated'}>↓</span>}
                                                                {!combust && !vargottama && !exalted && !debilitated && <span className="text-gray-300">—</span>}
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
                            {activeChart?.houses && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider p-4 pb-2">
                                        {lang === 'hi' ? UI_HI.houseDetails : 'House Details'}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 p-4 pt-2">
                                        {activeChart.houses.map(houseData => {
                                            const housePlanets = activeChart.planets.filter(p => p.house === houseData.house);
                                            return (
                                                <div key={houseData.house} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 text-center">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">
                                                        {lang === 'hi' ? UI_HI.house : 'House'} {houseData.house}
                                                    </div>
                                                    <div className="text-xs font-semibold text-indigo-700 mt-0.5">{hi(RASHI_HI, houseData.sign, lang)}({houseData.sign_id})</div>
                                                    {housePlanets.length > 0 && (
                                                        <div className="mt-1 flex flex-wrap justify-center gap-1">
                                                            {housePlanets.map(p => {
                                                                const key = p.name.toLowerCase();
                                                                return (
                                                                    <span
                                                                        key={p.name}
                                                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                                                        style={{
                                                                            color: PLANET_COLORS[key] || '#333',
                                                                            backgroundColor: `${PLANET_COLORS[key] || '#333'}15`
                                                                        }}
                                                                    >
                                                                        {lang === 'hi' ? hi(PLANET_NAME_HI, p.name, lang) : PLANET_SHORT[key] || p.name}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Vimshottari Dasha */}
                            {activePeriods && activePeriods.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider p-4 pb-2 flex items-center gap-2">
                                        <Clock size={14} className="text-indigo-600" />
                                        {lang === 'hi' ? UI_HI.vimshottariDasha : 'Vimshottari Dasha'}
                                    </h3>
                                    <div className="p-4 pt-1 space-y-3">
                                        {activePeriods.map(period => (
                                            <div key={period.level}>
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        {hi(DASHA_LEVEL_HI, period.level, lang)}: {period.path.map(p => hi(PLANET_NAME_HI, p, lang)).join(' → ')}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {period.start} – {period.end}
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${Math.min(period.progress_fraction * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {lang === 'hi'
                                                        ? UI_HI.yrsRemainingOf(period.remaining_years.toFixed(1), period.duration_years.toFixed(1))
                                                        : `${period.remaining_years.toFixed(1)} yrs remaining of ${period.duration_years.toFixed(1)} yrs`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Yogas & Doshas */}
                            {yogas && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider p-4 pb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-purple-600" />
                                            {lang === 'hi' ? UI_HI.yogasAndDoshas : 'Yogas & Doshas'}
                                        </span>
                                        {yogas.summary && (
                                            <span className="text-[10px] text-gray-400 normal-case font-normal">
                                                {lang === 'hi'
                                                    ? UI_HI.activeOf(yogas.summary.active, yogas.summary.total_evaluated)
                                                    : `${yogas.summary.active} active of ${yogas.summary.total_evaluated}`}
                                            </span>
                                        )}
                                    </h3>
                                    <div className="p-4 pt-1 flex flex-wrap gap-2">
                                        {yogas.yogas.filter(y => y.active).length === 0 && (
                                            <p className="text-xs text-gray-400">{lang === 'hi' ? UI_HI.noActiveYogas : 'No active yogas or doshas found.'}</p>
                                        )}
                                        {yogas.yogas.filter(y => y.active).map(yoga => {
                                            const isDosha = yoga.type === 'dosha';
                                            const name = lang === 'hi' ? (YOGA_NAME_HI[yoga.id] || yoga.name) : yoga.name;
                                            const strength = yoga.strength ? hi(STRENGTH_HI, yoga.strength, lang) : undefined;
                                            return (
                                                <span
                                                    key={yoga.id}
                                                    title={yoga.description}
                                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isDosha
                                                            ? 'bg-red-50 text-red-700 border-red-200'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}
                                                >
                                                    {name}{strength ? ` (${strength})` : ''}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Planetary Strength: Shadbala + Ashtakavarga */}
                            {(shadbala || ashtakavarga) && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider p-4 pb-2 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Gauge size={14} className="text-blue-600" />
                                            {lang === 'hi' ? UI_HI.planetaryStrength : 'Planetary Strength'}
                                        </span>
                                        {ashtakavarga && (
                                            <span className="text-[10px] text-gray-400 normal-case font-normal">
                                                {lang === 'hi' ? UI_HI.sarvashtakavarga(ashtakavarga.total_points) : `Sarvashtakavarga: ${ashtakavarga.total_points} pts`}
                                            </span>
                                        )}
                                    </h3>
                                    {shadbala && (
                                        <div className="p-4 pt-1 space-y-2">
                                            {Object.entries(shadbala).map(([planet, s]) => {
                                                const key = planet.toLowerCase();
                                                const strong = s.ratio >= 1;
                                                return (
                                                    <div key={planet} className="flex items-center gap-2">
                                                        <span className="w-16 text-xs font-semibold" style={{ color: PLANET_COLORS[key] || '#333' }}>
                                                            {hi(PLANET_NAME_HI, planet, lang)}
                                                        </span>
                                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${strong ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                                style={{ width: `${Math.min((s.ratio / 3) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="w-24 text-[10px] text-gray-400 text-right">
                                                            {lang === 'hi'
                                                                ? UI_HI.rupas(s.shadbala_in_rupas.toFixed(1), s.ratio.toFixed(2))
                                                                : `${s.shadbala_in_rupas.toFixed(1)} rupas (${s.ratio.toFixed(2)}x)`}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
        </>
    );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <span className="text-xs text-amber-700 font-semibold uppercase tracking-wide">{label}</span>
        <p className="text-sm text-gray-900 font-medium mt-0.5">{value}</p>
    </div>
);

const KundliPanel: React.FC<KundliPanelProps> = ({
    isOpen,
    onClose,
    chartData,
    seekerName = 'Seeker',
    loading = false,
    error = null,
}) => {
    if (!isOpen) return null;

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

                <KundliContent chartData={chartData} loading={loading} error={error} />
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

export default KundliPanel;
