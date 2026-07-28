import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Header from '../components/Header';
import ConsultationDetailModal from '../components/ConsultationDetailModal';
import { api } from '../services/api';
import type { Consultation } from '../types';

const ITEMS_PER_PAGE = 10;

const ChatHistoryPage: React.FC = () => {
    const [history, setHistory] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailConsultation, setDetailConsultation] = useState<Consultation | null>(null);

    useEffect(() => {
        api.consultations.getHistory()
            .then((data: Consultation[]) => {
                const past = data
                    .filter((c) => !['REQUESTED', 'ACCEPTED', 'ACTIVE', 'ONGOING', 'PAUSED'].includes(c.status))
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setHistory(past);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = history.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <Header />
            <main className="flex-1 container mx-auto p-4 md:p-8 max-w-3xl">
                <h1 className="text-xl font-bold text-gray-900 mb-4">Chat History</h1>

                {loading ? (
                    <div className="flex justify-center p-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E91E63]"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Date</th>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">User</th>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Status</th>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Earnings</th>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginated.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm text-gray-900">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                <span className="font-medium text-gray-900">{c.seeker_profile?.full_name || `User #${c.seeker_id}`}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${c.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono font-bold text-gray-900">₹{c.total_cost || 0}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setDetailConsultation(c)}
                                                    title="View"
                                                    aria-label="View"
                                                    className="text-gray-400 hover:text-[#E91E63] transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginated.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400">
                                                <p>No past consultations.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 py-5 border-t border-gray-100">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm text-gray-600 px-3">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <ConsultationDetailModal
                consultation={detailConsultation}
                onClose={() => setDetailConsultation(null)}
            />
        </div>
    );
};

export default ChatHistoryPage;
