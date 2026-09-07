import React, { useState } from 'react';
import { api } from '../services/api';

interface MoonSignData {
    sign: string;
    nakshatra: string;
    nakshatra_pada: string;
    sign_lord: string;
    longitude: number;
}

interface HoroscopeResponse {
    chart: {
        moon: MoonSignData;
    };
    moon_sign: MoonSignData;
}

interface MoonSignHoroscopeProps {
    sunSign: string;
}

const MoonSignHoroscope: React.FC<MoonSignHoroscopeProps> = ({ sunSign }) => {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [moonData, setMoonData] = useState<HoroscopeResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.freeTools.moonSignHoroscope({
                full_name: formData.fullName || undefined,
                date_of_birth: formData.dateOfBirth,
                time_of_birth: formData.timeOfBirth,
                place_of_birth: formData.placeOfBirth,
            });
            setMoonData(response);
            setShowForm(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch moon sign horoscope');
        } finally {
            setLoading(false);
        }
    };

    if (moonData) {
        const moon = moonData.moon_sign;
        return (
            <div className="glass-panel p-5 md:p-10 bg-gradient-to-br from-indigo-950/30 to-purple-950/30">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl md:text-3xl font-normal text-white">Your Moon Sign (Nakshatra)</h3>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="text-sm text-amber-500 hover:text-amber-400 underline"
                    >
                        Change
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="text-sm text-gray-400 mb-2">Moon Sign</div>
                        <div className="text-2xl font-normal text-amber-400">{moon.sign}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="text-sm text-gray-400 mb-2">Nakshatra</div>
                        <div className="text-2xl font-normal text-amber-400">{moon.nakshatra}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="text-sm text-gray-400 mb-2">Pada</div>
                        <div className="text-2xl font-normal text-amber-400">{moon.nakshatra_pada}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="text-sm text-gray-400 mb-2">Ruling Planet</div>
                        <div className="text-2xl font-normal text-amber-400">{moon.sign_lord}</div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Your Moon Sign ({moon.nakshatra}) represents your inner emotional world and subconscious mind.
                        In Vedic astrology, the Moon Sign is considered more accurate for daily predictions than the Sun Sign,
                        as it governs emotions, intuition, and personal reactions.
                    </p>
                </div>

                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-200">
                        💡 For detailed daily horoscope predictions based on your Moon Sign,
                        <a href="/astrologers" className="ml-1 font-medium text-amber-400 hover:text-amber-300">
                            consult with an astrologer
                        </a>
                    </p>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4 p-5 bg-white/5 rounded-xl border border-white/10">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Full Name (optional)</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Time of Birth (HH:MM)</label>
                            <input
                                type="time"
                                name="timeOfBirth"
                                value={formData.timeOfBirth}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Place of Birth</label>
                            <input
                                type="text"
                                name="placeOfBirth"
                                value={formData.placeOfBirth}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
                                placeholder="City, Country"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-500 text-indigo-950 font-normal py-2 rounded-lg hover:bg-amber-400 disabled:opacity-50"
                        >
                            {loading ? 'Calculating...' : 'Calculate Moon Sign'}
                        </button>
                    </form>
                )}
            </div>
        );
    }

    return (
        <div className="glass-panel p-5 md:p-10 bg-gradient-to-br from-indigo-950/30 to-purple-950/30 text-center">
            <h3 className="text-xl md:text-2xl font-normal text-white mb-4">Discover Your Moon Sign</h3>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                Your Moon Sign (Nakshatra) reveals your inner emotional world.
                In Vedic astrology, the Moon Sign is more accurate for daily predictions than your Sun Sign.
            </p>

            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="inline-block bg-amber-500 text-indigo-950 font-normal px-8 py-3 rounded-full hover:bg-amber-400 transition-all"
                >
                    Enter Your Birth Details
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Full Name (optional)</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Date of Birth *</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Time of Birth (HH:MM) *</label>
                        <input
                            type="time"
                            name="timeOfBirth"
                            value={formData.timeOfBirth}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Place of Birth *</label>
                        <input
                            type="text"
                            name="placeOfBirth"
                            value={formData.placeOfBirth}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
                            placeholder="City, Country"
                        />
                    </div>
                    {error && (
                        <div className="text-red-400 text-sm">{error}</div>
                    )}
                    <div className="space-y-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-500 text-indigo-950 font-normal py-2 rounded-lg hover:bg-amber-400 disabled:opacity-50"
                        >
                            {loading ? 'Calculating...' : 'Calculate Moon Sign'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="w-full text-gray-400 hover:text-gray-300 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default MoonSignHoroscope;
