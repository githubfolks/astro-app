import React, { useEffect, useState } from 'react';
import { payouts } from '../services/api';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Payouts() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchPayouts();
    }, []);

    const handleMarkPaid = async (stat) => {
        const ref = prompt("Enter Bank Transaction Reference ID:");
        if (!ref) return;

        try {
            // 1. Generate Payout Record
            const genRes = await payouts.generate({
                astrologer_id: stat.astrologer_id,
                amount: stat.pending_amount,
                tds_deducted: stat.tds_deduction ?? 0
            });
            const payoutId = genRes.data.id;

            // 2. Mark as Paid
            await payouts.markPaid(payoutId, ref);

            alert("Payout processed successfully!");
            fetchPayouts();
        } catch (err) {
            console.error(err);
            alert("Failed to process payout");
        }
    };

    if (loading) return <div>Loading Payout Data...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Astrologer Payouts</h1>

            <div className="grid gap-6">
                {stats.length === 0 ? (
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                        No pending payouts found. All settled!
                    </div>
                ) : (
                    stats.map((stat) => (
                        <div key={stat.astrologer_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{stat.astrologer_name}</h3>
                                <p className="text-sm text-gray-500">ID: {stat.astrologer_id} • Share: {stat.commission_percentage}%</p>
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
                                    onClick={() => handleMarkPaid(stat)}
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
        </div>
    );
}
