import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import { api } from '../services/api';
import type { PayoutHistoryItem } from '../types';

const ITEMS_PER_PAGE = 10;

const TransactionHistoryPage: React.FC = () => {
    const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        api.astrologers.getPayoutHistory()
            .then((data: PayoutHistoryItem[]) => {
                const sorted = [...data].sort((a, b) =>
                    new Date(b.processed_at || b.created_at).getTime() - new Date(a.processed_at || a.created_at).getTime()
                );
                setPayoutHistory(sorted);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const totalPages = Math.ceil(payoutHistory.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = payoutHistory.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <Header />
            <main className="flex-1 container mx-auto p-4 md:p-8 max-w-3xl">
                <h1 className="text-xl font-bold text-gray-900 mb-4">Payout &amp; Transaction History</h1>

                {loading ? (
                    <div className="flex justify-center p-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E91E63]"></div>
                    </div>
                ) : (
                    <div className="md:bg-white md:rounded-2xl md:shadow-sm md:overflow-hidden md:border md:border-gray-100">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Date</th>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Ref ID / Trans ID</th>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Status</th>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">TDS (10%)</th>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Net Paid</th>
                                        <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Comments</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginated.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm text-gray-600 font-medium">
                                                {new Date(p.processed_at || p.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-sm font-mono text-gray-900 font-bold">
                                                {p.transaction_reference || '—'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${p.status === 'PROCESSED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-mono text-gray-900 font-semibold">
                                                ₹{Number(p.tds_deducted || 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-sm font-mono font-bold text-green-600">
                                                ₹{Number(p.amount || 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate" title={p.admin_comments || ''}>
                                                {p.admin_comments || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {paginated.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-400">
                                                <p>No payout transactions found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden space-y-2">
                            {paginated.map((p) => (
                                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-mono font-bold text-gray-900 truncate">
                                            {p.transaction_reference || '—'}
                                        </span>
                                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.status === 'PROCESSED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {new Date(p.processed_at || p.created_at).toLocaleDateString()}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-500">
                                            TDS: <span className="font-mono font-semibold text-gray-900">₹{Number(p.tds_deducted || 0).toFixed(2)}</span>
                                        </span>
                                        <span className="text-sm font-mono font-bold text-green-600">
                                            ₹{Number(p.amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {p.admin_comments && (
                                        <p className="text-xs text-gray-500 mt-1.5 truncate" title={p.admin_comments}>{p.admin_comments}</p>
                                    )}
                                </div>
                            ))}
                            {paginated.length === 0 && (
                                <p className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">No payout transactions found.</p>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 py-5 mt-2 md:mt-0 md:border-t md:border-gray-100">
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
        </div>
    );
};

export default TransactionHistoryPage;
