import React, { useCallback, useEffect, useState } from 'react';
import { getBrowserLocation, getIpBasedLocation } from '../utils/location';
import type { UserCoords } from '../utils/location';
import { api } from '../services/api';
import { MapPin, Sun, Moon, RefreshCw } from 'lucide-react';
import './PanchangSection.css';

interface PanchangData {
    date: string;
    place: string;
    tithi: number;
    paksha: string;
    varH: string;
    varE: string;
    nakshatraName: string;
    nakshatraCharan: number;
    yog: string;
    karan: string;
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    maahSolar: string;
    maahPurnimant: string;
    maahAmant: string;
    ritu: string;
    ayan: string;
    gol: string;
}



const PanchangSection: React.FC = () => {
    const [coords, setCoords] = useState<UserCoords | null>(null);
    const [panchang, setPanchang] = useState<PanchangData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadPanchang = useCallback(async (userCoords: UserCoords) => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.cms.getPanchangNow(userCoords.lat, userCoords.lon, userCoords.place);
            setPanchang(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load Panchang data");
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
                if (cached) {
                    activeCoords = JSON.parse(cached);
                } else {
                    try {
                        activeCoords = await getBrowserLocation();
                    } catch {
                        activeCoords = await getIpBasedLocation();
                    }
                }
            }
            setCoords(activeCoords);
            localStorage.setItem('user_coords', JSON.stringify(activeCoords));
            await loadPanchang(activeCoords);
        } catch {
            setError("Could not resolve location. Using default location.");
            const fallback: UserCoords = { lat: 28.6139, lon: 77.2090, place: "New Delhi" };
            setCoords(fallback);
            await loadPanchang(fallback);
        }
    }, [loadPanchang]);

    useEffect(() => {
        detectLocationAndLoad();
    }, [detectLocationAndLoad]);

    const formatTime = (isoString: string) => {
        if (!isoString) return "--:--";
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return isoString;
        }
    };



    return (
        <div className="panchang-widget relative z-10" data-aos="fade-up">
            <div className="mb-12 text-center">
                <span className="text-amber-500 font-semibold uppercase tracking-widest text-sm mb-3 block">Daily Almanac</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Today's <span className="text-amber-500">Panchang</span>
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                    Real-time Vedic calculations for your location including Tithi, Nakshatra, and auspicious timings.
                </p>

                <div className="flex items-center justify-center gap-3 mt-6 bg-white/5 border border-white/10 backdrop-blur-md rounded-full px-5 py-2 w-fit mx-auto">
                    <MapPin size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-gray-200">
                        {coords ? `${coords.place} (${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°)` : 'Detecting...'}
                    </span>
                    <button 
                        onClick={() => detectLocationAndLoad(true)} 
                        disabled={refreshing}
                        className="p-1 rounded-full hover:bg-white/10 transition-colors text-amber-500 active:scale-95"
                        title="Refresh Location"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <RefreshCw size={40} className="text-amber-500 animate-spin mb-4" />
                    <p className="text-gray-400">Computing celestial coordinates...</p>
                </div>
            ) : error ? (
                <div className="max-w-md mx-auto text-center p-8 bg-red-500/10 border border-red-500/20 rounded-3xl">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={() => detectLocationAndLoad()} className="bg-amber-500 text-indigo-950 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-amber-400 transition-all">
                        Try Again
                    </button>
                </div>
            ) : panchang ? (
                <div className="w-full">
                    {/* Sun and Moon Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="astro-time-card">
                            <div className="icon-wrapper sun"><Sun size={20} /></div>
                            <span className="label">Sunrise</span>
                            <span className="value">{formatTime(panchang.sunrise)}</span>
                        </div>
                        <div className="astro-time-card">
                            <div className="icon-wrapper sunset"><Sun size={20} /></div>
                            <span className="label">Sunset</span>
                            <span className="value">{formatTime(panchang.sunset)}</span>
                        </div>
                        <div className="astro-time-card">
                            <div className="icon-wrapper moon"><Moon size={20} /></div>
                            <span className="label">Moonrise</span>
                            <span className="value">{formatTime(panchang.moonrise)}</span>
                        </div>
                        <div className="astro-time-card">
                            <div className="icon-wrapper moonset"><Moon size={20} /></div>
                            <span className="label">Moonset</span>
                            <span className="value">{formatTime(panchang.moonset)}</span>
                        </div>
                    </div>




                </div>
            ) : null}
        </div>
    );
};

export default PanchangSection;
