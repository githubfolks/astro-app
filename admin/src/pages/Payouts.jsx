import React, { useEffect, useState } from 'react';
import { payouts } from '../services/api';
import { DollarSign, CheckCircle, Clock, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Payouts() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStat, setSelectedStat] = useState(null);
    const [transactionRef, setTransactionRef] = useState('');
    const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0]);
    const [comments, setComments] = useState('');
    const [processing, setProcessing] = useState(false);

    // History tab state
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // Grouping & Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedAstroIds, setExpandedAstroIds] = useState([]);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const res = await payouts.getPending();
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch payouts", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const res = await payouts.getHistory();
            setHistoryList(res.data);
        } catch (error) {
            console.error("Failed to fetch payout history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const handleOpenMarkPaid = (stat) => {
        setSelectedStat(stat);
        setTransactionRef('');
        setPayoutDate(new Date().toISOString().split('T')[0]);
        setComments('');
    };

    const toggleExpand = (astroId) => {
        setExpandedAstroIds(prev => 
            prev.includes(astroId) 
                ? prev.filter(id => id !== astroId) 
                : [...prev, astroId]
        );
    };

    const handleSubmitPayout = async (e) => {
        e.preventDefault();
        if (!transactionRef.trim()) {
            alert("Transaction Reference is required");
            return;
        }

        try {
            setProcessing(true);
            // 1. Generate Payout Record
            const genRes = await payouts.generate({
                astrologer_id: selectedStat.astrologer_id,
                amount: selectedStat.pending_amount,
                tds_deducted: selectedStat.tds_deduction ?? 0
            });
            const payoutId = genRes.data.id;

            // 2. Mark as Paid with date & comments
            await payouts.markPaid(payoutId, transactionRef, payoutDate, comments);

            alert("Payout processed successfully!");
            setSelectedStat(null);
            fetchPayouts();
            if (activeTab === 'history') {
                fetchHistory();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to process payout");
        } finally {
            setProcessing(false);
        }
    };

    // Grouping logic for Payout History
    const getGroupedPayouts = () => {
        const groups = {};
        historyList.forEach(item => {
            const id = item.astrologer_id || 0;
            if (!groups[id]) {
                groups[id] = {
                    astrologer_id: id,
                    astrologer_name: item.astrologer_name || 'Unknown Astrologer',
                    phone_number: item.phone_number,
                    total_amount: 0,
                    total_tds: 0,
                    payouts: []
                };
            }
            groups[id].total_amount += item.amount;
            groups[id].total_tds += item.tds_deducted;
            groups[id].payouts.push(item);
        });

        // Filter groups by search query
        return Object.values(groups).filter(group => 
            group.astrologer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (group.phone_number && group.phone_number.includes(searchQuery))
        );
    };

    if (loading && activeTab === 'pending') return <div>Loading Payout Data...</div>;

    const groupedHistory = getGroupedPayouts();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Astrologer Payouts</h1>
            </div>

            <div className="flex gap-4 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 px-1 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === 'pending'
                            ? 'border-[#E91E63] text-[#E91E63]'
                            : 'border-transparent text-gray-900 hover:text-gray-700'
                    }`}
                >
                    Pending Settlements
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-1 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === 'history'
                            ? 'border-[#E91E63] text-[#E91E63]'
                            : 'border-transparent text-gray-900 hover:text-gray-700'
                    }`}
                >
                    Payout History
                </button>
            </div>

            {activeTab === 'pending' ? (
                <div className="grid gap-6">
                    {stats.length === 0 ? (
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center text-gray-900">
                            No pending payouts found. All settled!
                        </div>
                    ) : (
                        stats.map((stat) => (
                            <div key={stat.astrologer_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{stat.astrologer_name}</h3>
                                    <p className="text-sm text-gray-900">
                                        {stat.phone_number && <span className="mr-3 font-semibold text-gray-700">{stat.phone_number}</span>}
                                        Share: {stat.commission_percentage}%
                                    </p>
                                </div>

                                <div className="flex gap-8 text-sm">
                                    <div>
                                        <span className="block text-gray-400 text-xs uppercase font-semibold">Total Revenue</span>
                                        <span className="font-mono font-medium">₹{stat.total_revenue.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-400 text-xs uppercase font-semibold">Gross Earnings</span>
                                        <span className="font-mono font-medium text-blue-600">₹{stat.gross_earnings.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-400 text-xs uppercase font-semibold">TDS (10%)</span>
                                        <span className="font-mono font-medium text-orange-600">₹{stat.tds_deduction.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-400 text-xs uppercase font-semibold">Paid So Far</span>
                                        <span className="font-mono font-medium text-green-600">₹{stat.paid_so_far.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">Pending Amount</span>
                                    <div className="text-2xl font-bold text-indigo-600 mb-2">₹{stat.pending_amount.toFixed(2)}</div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleOpenMarkPaid(stat)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle size={16} className="mr-2" />
                                        Mark Paid
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search astrologer by name or mobile number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E91E63] text-sm text-gray-900"
                        />
                    </div>

                    <div className="space-y-4">
                        {loadingHistory ? (
                            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-900">Loading payout history...</div>
                        ) : groupedHistory.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-900">No payout history found.</div>
                        ) : (
                            groupedHistory.map(group => {
                                const isExpanded = expandedAstroIds.includes(group.astrologer_id);
                                return (
                                    <div key={group.astrologer_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        {/* Group Header Card */}
                                        <div 
                                            onClick={() => toggleExpand(group.astrologer_id)}
                                            className="p-5 flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{group.astrologer_name}</h3>
                                                    <p className="text-sm text-gray-900 font-medium">
                                                        {group.phone_number && <span className="mr-3">{group.phone_number}</span>}
                                                        {group.payouts.length} payout{group.payouts.length > 1 ? 's' : ''} processed
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-8 text-sm">
                                                <div>
                                                    <span className="block text-gray-400 text-xs uppercase font-semibold">Total TDS Deducted</span>
                                                    <span className="font-mono font-medium text-orange-600">₹{group.total_tds.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 text-xs uppercase font-semibold">Total Net Paid</span>
                                                    <span className="font-mono font-bold text-green-600">₹{group.total_amount.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <button className="text-gray-400 hover:text-gray-600 p-1">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Transactions Table */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 overflow-x-auto bg-gray-50/30">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 text-gray-900 border-b border-gray-100 font-semibold uppercase tracking-wider">
                                                            <th className="p-3 pl-5">Payment Date</th>
                                                            <th className="p-3">Transaction Ref</th>
                                                            <th className="p-3">Status</th>
                                                            <th className="p-3 text-right">TDS (10%)</th>
                                                            <th className="p-3 text-right">Net Amount</th>
                                                            <th className="p-3 pr-5">Comments</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {group.payouts.map(p => (
                                                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="p-3 pl-5 text-gray-600">
                                                                    {new Date(p.processed_at || p.created_at).toLocaleDateString()}
                                                                </td>
                                                                <td className="p-3 font-mono font-semibold text-indigo-600">
                                                                    {p.transaction_reference || '—'}
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-150">
                                                                        {p.status}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-right font-mono text-gray-900">
                                                                    ₹{p.tds_deducted.toFixed(2)}
                                                                </td>
                                                                <td className="p-3 text-right font-mono font-bold text-green-600">
                                                                    ₹{p.amount.toFixed(2)}
                                                                </td>
                                                                <td className="p-3 pr-5 text-gray-900 max-w-[200px] truncate" title={p.admin_comments || ''}>
                                                                    {p.admin_comments || '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {selectedStat && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-100">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                            <h3 className="text-xl font-bold">Process Payout</h3>
                            <p className="text-white/80 text-sm mt-1">For {selectedStat.astrologer_name}</p>
                        </div>
                        <form onSubmit={handleSubmitPayout} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Net Payable Amount</label>
                                <div className="text-xl font-bold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                    ₹{selectedStat.pending_amount.toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction ID / Reference *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter UPI / Bank Ref ID"
                                    value={transactionRef}
                                    onChange={(e) => setTransactionRef(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={payoutDate}
                                    onChange={(e) => setPayoutDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Comments / Notes</label>
                                <textarea
                                    placeholder="Add any internal or seeker-facing payment notes..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-900"
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedStat(null)}
                                    disabled={processing}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <Button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : 'Submit Payment'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
