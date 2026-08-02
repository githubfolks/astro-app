import type { LiveMuhuratResponse, HoraPeriod, ChoghadiyaPeriod, MuhurtaPeriod } from '../types';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CityAutocomplete from '../components/CityAutocomplete';
import { getBrowserLocation, getIpBasedLocation } from '../utils/location';
import type { UserCoords } from '../utils/location';
import { api } from '../services/api';
import { ArrowLeft, Loader2, MapPin, RefreshCw, Search, Sun, Clock, Compass, Hourglass } from 'lucide-react';

import SEO from '../components/SEO';
import './services/ServicesDetail.css';

// Server refreshes are cheap (cached sunrise/sunset), but "current period"
// highlighting is computed client-side every second against a ticking clock
// so it doesn't depend on re-fetching.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const isCurrent = (start: string, end: string, now: Date) => {
    const t = now.getTime();
    return new Date(start).getTime() <= t && t < new Date(end).getTime();
};

const LiveMuhurat: React.FC = () => {
    const navigate = useNavigate();
    const [coords, setCoords] = useState<UserCoords | null>(null);
    const [data, setData] = useState<LiveMuhuratResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(new Date());
    const [placeQuery, setPlaceQuery] = useState('');
    const [showAllHoras, setShowAllHoras] = useState(false);
    const [showAllChoghadiyas, setShowAllChoghadiyas] = useState(false);
    const [showAllMuhurtas, setShowAllMuhurtas] = useState(false);

    const loadMuhurat = useCallback(async (opts: { lat?: number; lon?: number; place: string }) => {
        setLoading(true);
        setError(null);
        try {
            const result: LiveMuhuratResponse = await api.muhurat.getLive(opts);
            setData(result);
            // Keep `coords` in sync with whatever location the server actually
            // resolved (relevant when we only sent a place name to geocode).
            const resolved: UserCoords = { lat: result.latitude, lon: result.longitude, place: result.place_label || opts.place };
            setCoords(resolved);
            localStorage.setItem('user_coords', JSON.stringify(resolved));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load live Muhurat data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const detectLocationAndLoad = useCallback(async (forceBrowser = false) => {
        setRefreshing(true);
        setError(null);
        try {
            let activeCoords: UserCoords;
            if (forceBrowser) {
                activeCoords = await getBrowserLocation();
            } else {
                const cached = localStorage.getItem('user_coords');
                activeCoords = cached ? JSON.parse(cached) : await getIpBasedLocation();
            }
            setCoords(activeCoords);
            localStorage.setItem('user_coords', JSON.stringify(activeCoords));
            await loadMuhurat(activeCoords);
        } catch {
            const fallback: UserCoords = { lat: 28.6139, lon: 77.2090, place: 'New Delhi' };
            setCoords(fallback);
            await loadMuhurat(fallback);
        }
    }, [loadMuhurat]);

    useEffect(() => {
        detectLocationAndLoad();
    }, [detectLocationAndLoad]);

    // Tick every second for a live clock + current-period highlighting;
    // re-fetch periodically so the timeline rolls over correctly around
    // sunrise/sunset without requiring a manual refresh.
    useEffect(() => {
        const tick = setInterval(() => setNow(new Date()), 1000);
        const refetch = setInterval(() => {
            if (coords) loadMuhurat(coords);
        }, REFRESH_INTERVAL_MS);
        return () => { clearInterval(tick); clearInterval(refetch); };
    }, [coords, loadMuhurat]);

    const handlePlaceSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!placeQuery.trim()) return;
        await loadMuhurat({ place: placeQuery.trim() });
    };

    const currentHora = data?.horas.find(h => isCurrent(h.start, h.end, now));
    const currentChoghadiya = data?.choghadiyas.find(c => isCurrent(c.start, c.end, now));
    const currentMuhurta = data?.muhurtas.find(m => isCurrent(m.start, m.end, now));

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Live Hora & Muhurat | Aadikarta Vedic Astrology"
                description="Live current Hora, Choghadiya, 15-muhurta Do Ghati window, and current Lagna for any location — a real-time astrological timing tool for astrologers."
                keywords="Aadikarta Vedic Astrology, live hora, choghadiya, muhurat, current lagna, do ghati"
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
                    <Link to="/kundli" className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">Kundli Generator</Link>
                    <Link to="/kundli/matching" className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-amber-500/10 hover:text-amber-500 transition-colors">Kundli Matching</Link>
                    <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500">Live Hora & Muhurat</span>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-normal text-white">🕐 Live Hora & Muhurat</h1>
                        <p className="text-gray-300 mt-2">Current Hora, Choghadiya, Lagna and 15-muhurta window for any location</p>
                    </div>

                    <form onSubmit={handlePlaceSearch} className="service-glass-panel p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex-1">
                            <CityAutocomplete
                                value={placeQuery}
                                onChange={setPlaceQuery}
                                className="w-full border border-white/10 rounded-xl px-4 py-2.5 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                                placeholder="Search a city..."
                                dropdownClassName="bg-[#1a1530] text-white divide-y divide-white/5"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !placeQuery.trim()}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                        >
                            <Search size={16} />
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={() => detectLocationAndLoad(true)}
                            disabled={refreshing}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-amber-500 hover:border-amber-500/30 transition-colors text-sm font-medium whitespace-nowrap"
                            title="Use my current location"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            Use My Location
                        </button>
                    </form>

                    {coords && (
                        <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-400">
                            <MapPin size={14} className="text-amber-500" />
                            {coords.place} ({coords.lat.toFixed(2)}°, {coords.lon.toFixed(2)}°)
                            <span className="mx-1">·</span>
                            {now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center min-h-[300px] service-glass-panel">
                            <Loader2 size={40} className="text-amber-500 animate-spin mb-4" />
                            <p className="text-gray-400">Computing live timings...</p>
                        </div>
                    ) : error ? (
                        <div className="service-glass-panel p-8 text-center">
                            <p className="text-red-400 mb-4">{error}</p>
                            <button onClick={() => detectLocationAndLoad()} className="bg-amber-500 text-indigo-950 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-amber-400 transition-all">
                                Try Again
                            </button>
                        </div>
                    ) : data ? (
                        <>
                            {/* Current status cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="service-glass-panel p-5">
                                    <div className="flex items-center gap-2 text-amber-500 font-semibold mb-2">
                                        <Clock size={18} /> Current Hora
                                    </div>
                                    {currentHora ? (
                                        <>
                                            <div className="text-2xl text-white font-normal">{currentHora.planet}</div>
                                            <div className="text-sm text-gray-400 mt-1">{formatTime(currentHora.start)} – {formatTime(currentHora.end)}</div>
                                        </>
                                    ) : <div className="text-gray-500 text-sm">Unavailable</div>}
                                </div>

                                <div className="service-glass-panel p-5">
                                    <div className="flex items-center gap-2 text-amber-500 font-semibold mb-2">
                                        <Sun size={18} /> Current Choghadiya
                                    </div>
                                    {currentChoghadiya ? (
                                        <>
                                            <div className="text-2xl text-white font-normal">{currentChoghadiya.name}</div>
                                            <div className="text-sm text-gray-400 mt-1">{currentChoghadiya.nature} · {formatTime(currentChoghadiya.start)} – {formatTime(currentChoghadiya.end)}</div>
                                        </>
                                    ) : <div className="text-gray-500 text-sm">Unavailable</div>}
                                </div>

                                <div className="service-glass-panel p-5">
                                    <div className="flex items-center gap-2 text-amber-500 font-semibold mb-2">
                                        <Compass size={18} /> Current Lagna
                                    </div>
                                    <div className="text-2xl text-white font-normal">{data.current_lagna.sign}</div>
                                    <div className="text-sm text-gray-400 mt-1">{formatTime(data.current_lagna.start)} – {formatTime(data.current_lagna.end)}</div>
                                </div>

                                <div className="service-glass-panel p-5">
                                    <div className="flex items-center gap-2 text-amber-500 font-semibold mb-2">
                                        <Hourglass size={18} /> Current Muhurta (Do Ghati)
                                    </div>
                                    {currentMuhurta ? (
                                        <>
                                            <div className="text-2xl text-white font-normal">{currentMuhurta.name}</div>
                                            <div className="text-sm text-gray-400 mt-1">{formatTime(currentMuhurta.start)} – {formatTime(currentMuhurta.end)}</div>
                                        </>
                                    ) : <div className="text-gray-500 text-sm">Daytime only — not available at night</div>}
                                </div>
                            </div>

                            <div className="text-center text-xs text-gray-500 mb-8">
                                Sunrise {formatTime(data.sunrise)} · Sunset {formatTime(data.sunset)}
                            </div>

                            {/* Full-day timelines */}
                            <div className="space-y-4">
                                <TimelineSection
                                    title="Full Hora Timeline"
                                    expanded={showAllHoras}
                                    onToggle={() => setShowAllHoras(v => !v)}
                                >
                                    {data.horas.map((h: HoraPeriod, i: number) => (
                                        <TimelineRow key={i} active={isCurrent(h.start, h.end, now)}>
                                            <span>{h.planet}</span>
                                            <span className="text-gray-400 text-xs">{formatTime(h.start)} – {formatTime(h.end)}</span>
                                        </TimelineRow>
                                    ))}
                                </TimelineSection>

                                <TimelineSection
                                    title="Full Choghadiya Timeline"
                                    expanded={showAllChoghadiyas}
                                    onToggle={() => setShowAllChoghadiyas(v => !v)}
                                >
                                    {data.choghadiyas.map((c: ChoghadiyaPeriod, i: number) => (
                                        <TimelineRow key={i} active={isCurrent(c.start, c.end, now)}>
                                            <span>{c.name} <span className="text-gray-500 text-xs">({c.nature})</span></span>
                                            <span className="text-gray-400 text-xs">{formatTime(c.start)} – {formatTime(c.end)}</span>
                                        </TimelineRow>
                                    ))}
                                </TimelineSection>

                                <TimelineSection
                                    title="Full 15-Muhurta (Do Ghati) Timeline"
                                    expanded={showAllMuhurtas}
                                    onToggle={() => setShowAllMuhurtas(v => !v)}
                                >
                                    {data.muhurtas.map((m: MuhurtaPeriod, i: number) => (
                                        <TimelineRow key={i} active={isCurrent(m.start, m.end, now)}>
                                            <span>{m.name}</span>
                                            <span className="text-gray-400 text-xs">{formatTime(m.start)} – {formatTime(m.end)}</span>
                                        </TimelineRow>
                                    ))}
                                </TimelineSection>
                            </div>
                        </>
                    ) : null}

                    <section className="mt-16 service-glass-panel p-8">
                        <h2 className="text-2xl font-normal text-white mb-4">About These Timings</h2>
                        <div className="space-y-3 text-gray-300 leading-relaxed text-sm">
                            <p>
                                <strong className="text-white">Hora</strong> divides the period from sunrise to the next sunrise into 24 unequal "planetary hours", each ruled by one of the seven classical planets in the traditional Chaldean order — useful for choosing an auspicious planet's influence for a given activity.
                            </p>
                            <p>
                                <strong className="text-white">Choghadiya</strong> divides daytime and nighttime into 8 equal parts each, cycling through seven named periods (Udveg, Chal, Labh, Amrit, Kaal, Shubh, Rog) that indicate whether a window is broadly auspicious, inauspicious, or neutral.
                            </p>
                            <p>
                                <strong className="text-white">Lagna</strong> (ascendant) is the zodiac sign rising on the eastern horizon at this moment, computed from your location's sidereal time using the Lahiri ayanamsha — the same calculation used by our Kundli Generator.
                            </p>
                            <p>
                                <strong className="text-white">Do Ghati Muhurta</strong> divides daylight hours into 15 equal ~48-minute windows, each carrying a traditional name from the Muhurta Chintamani — the 8th, Abhijit, is the best known, falling near solar noon.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

const TimelineSection: React.FC<{ title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, expanded, onToggle, children }) => (
    <div className="service-glass-panel overflow-hidden">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-4 text-left text-white font-normal hover:bg-white/5 transition-colors"
        >
            {title}
            <span className="text-amber-500 text-sm">{expanded ? 'Hide' : 'Show'}</span>
        </button>
        {expanded && (
            <div className="px-4 pb-4 space-y-1">
                {children}
            </div>
        )}
    </div>
);

const TimelineRow: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${active ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-gray-300'}`}>
        {children}
    </div>
);

export default LiveMuhurat;
