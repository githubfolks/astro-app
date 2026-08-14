import React, { useEffect, useState, useCallback } from 'react';
import { reviewModeration } from '../services/api';
import { Button } from '../components/ui/Button';
import { Star, Pencil, X, Check } from 'lucide-react';

const STATUS_COLORS = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-gray-100 text-gray-700',
};

export default function ReviewModeration() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('PENDING');

    // Edit modal state
    const [editingReview, setEditingReview] = useState(null);
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState('');
    const [editStatus, setEditStatus] = useState('APPROVED');
    const [saving, setSaving] = useState(false);

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

    const handleOpenEdit = (review) => {
        setEditingReview(review);
        setEditRating(review.rating || 5);
        setEditComment(review.comment || '');
        setEditStatus(review.display_status || 'APPROVED');
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingReview) return;
        setSaving(true);
        try {
            await reviewModeration.update(editingReview.id, {
                rating: editRating,
                comment: editComment,
                display_status: editStatus,
            });
            setEditingReview(null);
            fetchReviews();
        } catch (err) {
            console.error('Failed to update review:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl text-gray-900 flex items-center gap-2">
                    <Star className="text-amber-500 fill-amber-500" /> Review Moderation & Management
                </h1>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 font-medium shadow-sm"
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>
            <p className="text-sm text-gray-600 mb-6">
                Manage, edit, approve, or reject user reviews. Edit ratings, comments, and public display status for website and profile testimonials.
            </p>

            {loading ? (
                <div className="p-8 text-center text-gray-600 font-medium">Loading reviews…</div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-700">No reviews found for this status.</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-700 font-bold">
                            <tr>
                                <th className="p-3.5">When</th>
                                <th className="p-3.5">Astrologer</th>
                                <th className="p-3.5">Seeker</th>
                                <th className="p-3.5">Rating</th>
                                <th className="p-3.5">Comment</th>
                                <th className="p-3.5">Flag Reason</th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3.5 text-gray-600 text-xs">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                                    <td className="p-3.5 font-medium text-gray-900">{r.astrologer_name || `#${r.astrologer_id}`}</td>
                                    <td className="p-3.5 text-gray-700">{r.seeker_name || `#${r.seeker_id}`}</td>
                                    <td className="p-3.5 text-amber-500 font-bold whitespace-nowrap">
                                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                        <span className="text-gray-500 font-normal text-xs ml-1">({r.rating}/5)</span>
                                    </td>
                                    <td className="p-3.5 max-w-xs truncate text-gray-800" title={r.comment}>{r.comment}</td>
                                    <td className="p-3.5">
                                        {r.moderation_reason && (
                                            <span className="font-mono text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{r.moderation_reason}</span>
                                        )}
                                    </td>
                                    <td className="p-3.5">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[r.display_status] || ''}`}>{r.display_status}</span>
                                    </td>
                                    <td className="p-3.5 text-right whitespace-nowrap">
                                        <div className="flex gap-1.5 justify-end items-center">
                                            {/* Edit Button */}
                                            <button
                                                onClick={() => handleOpenEdit(r)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                                title="Edit Review"
                                            >
                                                <Pencil className="w-3 h-3" /> Edit
                                            </button>

                                            {r.display_status !== 'APPROVED' && (
                                                <Button onClick={() => decide(r.id, 'approve')} className="text-xs py-1 px-2.5">Approve</Button>
                                            )}
                                            {r.display_status !== 'REJECTED' && (
                                                <button
                                                    onClick={() => decide(r.id, 'reject')}
                                                    className="text-xs text-gray-600 hover:text-red-600 border border-gray-200 px-2.5 py-1 rounded bg-white hover:bg-red-50 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Review Modal */}
            {editingReview && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-200 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-indigo-600" /> Edit Review #{editingReview.id}
                            </h3>
                            <button
                                onClick={() => setEditingReview(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Rating (1 to 5 Stars)
                                </label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setEditRating(star)}
                                            className={`p-1 text-2xl transition-transform hover:scale-110 ${
                                                star <= editRating ? 'text-amber-400' : 'text-gray-300'
                                            }`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    <span className="text-sm font-semibold text-gray-700 ml-2">{editRating} / 5 Stars</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Review Comment
                                </label>
                                <textarea
                                    value={editComment}
                                    onChange={(e) => setEditComment(e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="Enter review feedback text..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Display Status
                                </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 font-medium bg-white"
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setEditingReview(null)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <Button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2">
                                    <Check className="w-4 h-4" />
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
