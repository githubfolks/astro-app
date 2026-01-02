import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Star, MessageCircle } from 'lucide-react';

interface Astrologer {
    user_id: number;
    full_name: string;
    profile_picture_url: string;
    specialties: string;
    languages: string;
    consultation_fee_per_min: number;
    is_online: boolean;
    rating_avg: number;
}

export const Dashboard: React.FC = () => {
    const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            try {
                if (user?.role === 'ASTROLOGER') {
                    const data = await api.consultations.getHistory();
                    setHistory(data);
                } else {
                    const data = await api.astrologers.list();
                    setAstrologers(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    const startChat = (astroId: number) => {
        createConsultation(astroId);
    };

    const createConsultation = async (astroId: number) => {
        try {
            const res = await api.consultations.create({ astrologer_id: astroId, consultation_type: 'CHAT' });
            navigate(`/chat/${res.id}`);
        } catch (e) {
            console.error(e);
            alert('Failed to start chat. Check console for details.');
        }
    };

    if (user?.role === 'ASTROLOGER') {
        return (
            <Layout>
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Astrologer Dashboard</h2>
                    <p className="text-gray-400">View your consultation history and upcoming requests.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20"><div className="animate-spin h-10 w-10 border-4 border-purple-500 rounded-full border-t-transparent"></div></div>
                ) : (
                    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900 border-b border-gray-700">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Seeker ID</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Cost</th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((c: any) => (
                                    <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-750">
                                        <td className="p-4">#{c.id}</td>
                                        <td className="p-4">{c.seeker_id}</td>
                                        <td className="p-4 text-sm bg-gray-900 rounded px-2 py-1 inline-block">{c.consultation_type}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${c.status === 'COMPLETED' ? 'bg-green-900 text-green-300' :
                                                c.status === 'ACTIVE' ? 'bg-blue-900 text-blue-300' :
                                                    'bg-yellow-900 text-yellow-300'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono">₹{c.total_cost}</td>
                                        <td className="p-4">
                                            <button onClick={() => navigate(`/chat/${c.id}`)} className="text-purple-400 hover:text-purple-300 font-semibold text-sm">
                                                Open Chat
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">No consultations found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Talk to Astrologers</h2>
                <p className="text-gray-400">Consult with India's best astrologers online.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><div className="animate-spin h-10 w-10 border-4 border-purple-500 rounded-full border-t-transparent"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {astrologers.map((astro) => (
                        <div key={astro.user_id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                            <div className="p-6 flex gap-4">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden">
                                        {astro.profile_picture_url ? (
                                            <img src={astro.profile_picture_url} alt={astro.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-indigo-900 text-indigo-300">
                                                {astro.full_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${astro.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg">{astro.full_name}</h3>
                                        <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                            <Star size={14} fill="currentColor" />
                                            <span>{Number(astro.rating_avg).toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-400 mb-2">{astro.specialties || "Vedic Astrology"}</div>
                                    <div className="text-sm text-gray-400 mb-2">{astro.languages || "English, Hindi"}</div>
                                    <div className="font-bold text-purple-400">₹{astro.consultation_fee_per_min}/min</div>
                                </div>
                            </div>

                            <div className="bg-gray-750 p-4 border-t border-gray-700">
                                <button onClick={() => startChat(astro.user_id)} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold transition-colors">
                                    <MessageCircle size={18} /> Chat
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};
