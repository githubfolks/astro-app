import React, { useEffect, useState, useCallback } from 'react';
import { reviewModeration } from '../services/api';
import { Button } from '../components/ui/Button';
import { Star } from 'lucide-react';

const STATUS_COLORS = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-gray-100 text-gray-700',
};

export default function ReviewModeration() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('PENDING');

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const res = await reviewModeration.list(filterStatus ? { status: filterStatus } : {});
            setItems(res.data.reviews || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const decide = async (id, action) => {
        try {
            await reviewModeration[action](id);
            fetchReviews();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Star className="text-amber-500" /> Review Moderation
                </h1>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>
            <p className="text-sm text-gray-500 mb-4">
                Reviews with a written comment (rating 4+) are auto-approved when they pass the same contact-info/spam
                scan used on chat messages. Anything flagged lands here for a manual decision before it can appear on
                the homepage or an astrologer's profile.
            </p>

            {loading ? (
                <p className="text-gray-900">Loading…</p>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-900">No reviews found.</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-900">
                            <tr>
                                <th className="p-3">When</th>
                                <th className="p-3">Astrologer</th>
                                <th className="p-3">Seeker</th>
                                <th className="p-3">Rating</th>
                                <th className="p-3">Comment</th>
                                <th className="p-3">Flag Reason</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-gray-900">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                                    <td className="p-3">{r.astrologer_name || `#${r.astrologer_id}`}</td>
                                    <td className="p-3">{r.seeker_name || `#${r.seeker_id}`}</td>
                                    <td className="p-3">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                                    <td className="p-3 max-w-sm truncate text-gray-700" title={r.comment}>{r.comment}</td>
                                    <td className="p-3">
                                        {r.moderation_reason && (
                                            <span className="font-mono text-xs text-red-600">{r.moderation_reason}</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[r.display_status] || ''}`}>{r.display_status}</span>
                                    </td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                        <div className="flex gap-2 justify-end">
                                            {r.display_status !== 'APPROVED' && (
                                                <Button onClick={() => decide(r.id, 'approve')} className="text-xs">Approve</Button>
                                            )}
                                            {r.display_status !== 'REJECTED' && (
                                                <button onClick={() => decide(r.id, 'reject')} className="text-xs text-gray-900 hover:text-gray-700">Reject</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
