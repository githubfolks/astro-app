import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RefreshCw, Star, Info } from 'lucide-react';
import './TransitSection.css';

interface PlanetState {
    position: string;
    nakshatra: [number, number]; // [nakshatra_id, pada]
    retrograde: boolean;
    combust: boolean;
    exalted: boolean;
    debilitated: boolean;
    moolTrikona: boolean;
    ownSign: boolean;
    charKaraka: number | null;
}

interface TransitData {
    ayanamsha: string;
    planets: Record<string, PlanetState>;
}

const NAKSHATRA_NAMES = [
    "", "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", 
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", 
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", 
    "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", 
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const SIGN_NAMES = [
    "Aries (Mesh)", "Taurus (Vrishabh)", "Gemini (Mithun)", "Cancer (Kark)", 
    "Leo (Simha)", "Virgo (Kanya)", "Libra (Tula)", "Scorpio (Vrishchik)", 
    "Sagittarius (Dhanu)", "Capricorn (Makar)", "Aquarius (Kumbha)", "Pisces (Meen)"
];

const TransitSection: React.FC = () => {
    const [transit, setTransit] = useState<TransitData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTransit = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.cms.getTransit();
            setTransit(data);
        } catch (err: any) {
            setError(err.message || "Failed to load Transit data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransit();
    }, []);

    const parseDegree = (position: string) => {
        // Format of position is typically "SignNum:Degree:Minute:Second" (e.g. "02:03:41:52")
        if (!position) return { sign: "", deg: "" };
        const parts = position.split(':');
        const signIndex = parseInt(parts[0]);
        const deg = parts[1];
        const min = parts[2];
        return {
            sign: SIGN_NAMES[signIndex] || `Sign ${signIndex}`,
            deg: `${deg}° ${min}'`
        };
    };

    return (
        <div className="transit-widget relative z-10" data-aos="fade-up">
            <div className="mb-16 text-center">
                <span className="text-amber-500 font-semibold uppercase tracking-widest text-sm mb-3 block">Cosmic Alignment</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Current Planetary <span className="text-amber-500">Transits</span>
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                    Track the real-time positions of planets in the zodiac signs according to Vedic Astrology (Sidereal/Nirayana).
                </p>

                <button 
                    onClick={loadTransit} 
                    className="mt-6 flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/35 text-amber-500 hover:text-amber-400 font-bold px-6 py-2.5 rounded-full text-sm transition-all active:scale-95 mx-auto shadow-md"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh Sky Chart
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <RefreshCw size={40} className="text-amber-500 animate-spin mb-4" />
                    <p className="text-gray-400">Charting current planetary coordinate systems...</p>
                </div>
            ) : error ? (
                <div className="max-w-md mx-auto text-center p-8 bg-red-500/10 border border-red-500/20 rounded-3xl">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={loadTransit} className="bg-amber-500 text-indigo-950 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-amber-400 transition-all">
                        Retry
                    </button>
                </div>
            ) : transit ? (
                <div className="w-full">
                    {/* Ayanamsha Box */}
                    <div className="flex items-center justify-center gap-2 mb-10 text-xs font-semibold text-gray-400 uppercase tracking-widest bg-white/5 border border-white/10 backdrop-blur-md rounded-full px-5 py-2.5 w-fit mx-auto">
                        <Info size={14} className="text-amber-500" />
                        <span>Ayanamsha (Lahiri): <strong className="text-white">{transit.ayanamsha}</strong></span>
                    </div>

                    {/* Planets Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(transit.planets).map(([planetName, data]) => {
                            const pos = parseDegree(data.position);
                            const nakshatra = NAKSHATRA_NAMES[data.nakshatra[0]] || `Nakshatra ${data.nakshatra[0]}`;
                            return (
                                <div key={planetName} className="planet-transit-card">
                                    <div className="header">
                                        <h3 className="planet-name capitalize">{planetName}</h3>
                                        <div className="badges">
                                            {data.retrograde && <span className="badge retrograde">Vakri</span>}
                                            {data.combust && <span className="badge combust">Combust</span>}
                                            {data.exalted && <span className="badge exalted">Exalted</span>}
                                            {data.debilitated && <span className="badge debilitated">Debilitated</span>}
                                            {data.ownSign && <span className="badge own-sign">Own Sign</span>}
                                        </div>
                                    </div>
                                    <div className="body">
                                        <div className="row">
                                            <span className="label">Zodiac Sign</span>
                                            <span className="val font-semibold text-white text-right">{pos.sign.split(' ')[0]}</span>
                                        </div>
                                        <div className="row">
                                            <span className="label">Degree</span>
                                            <span className="val font-medium text-amber-500">{pos.deg}</span>
                                        </div>
                                        <div className="row">
                                            <span className="label">Constellation</span>
                                            <span className="val text-gray-300 text-right">
                                                {nakshatra}
                                            </span>
                                        </div>
                                    </div>
                                    {data.charKaraka && (
                                        <div className="footer">
                                            <Star size={12} className="text-amber-500" />
                                            <span>Rank: {data.charKaraka}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default TransitSection;
