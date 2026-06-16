import React, { useEffect, useState } from 'react';
import { disputes } from '../services/api';
import { AlertCircle, CheckCircle, XCircle, Search, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';

const STATUS_COLORS = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    INVESTIGATING: 'bg-blue-100 text-blue-800',
    RESOLVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

export default function Disputes() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ status: '', admin_notes: '', refund_amount: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const res = await disputes.list(filterStatus ? { status: filterStatus } : {});
            setItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDisputes(); }, [filterStatus]);

    const openModal = (item) => {
        setSelected(item);
        setForm({ status: item.status, admin_notes: item.admin_notes || '', refund_amount: '' });
        setError('');
    };

    const closeModal = () => { setSelected(null); setError(''); };

    const handleSave = async () => {
        if (!form.status) { setError('Please select a status'); return; }
        setSaving(true);
        setError('');
        try {
            const payload = {
                status: form.status,
                admin_notes: form.admin_notes || null,
                refund_amount: form.status === 'RESOLVED' && form.refund_amount
                    ? parseFloat(form.refund_amount)
                    : null
            };
            await disputes.resolve(selected.id, payload);
            closeModal();
            fetchDisputes();
        } catch (err) {
            setError(err.message || 'Failed to update dispute');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="appearance-none border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="INVESTIGATING">Investigating</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No disputes found.</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Consultation</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Raised By</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Refund</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.id}</td>
                                    <td className="px-4 py-3">{item.consultation_id}</td>
                                    <td className="px-4 py-3">{item.raised_by_id}</td>
                                    <td className="px-4 py-3 max-w-xs truncate text-gray-700">{item.reason}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {item.resolution_amount ? `₹${item.resolution_amount}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {new Date(item.created_at).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {(item.status === 'OPEN' || item.status === 'INVESTIGATING') && (
                                            <Button size="sm" variant="outline" onClick={() => openModal(item)}>
                                                Review
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Review Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Review Dispute #{selected.id}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reason</p>
                                <p className="text-sm text-gray-800 bg-gray-50 rounded p-3">{selected.reason}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Update Status</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="INVESTIGATING">Investigating</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Admin Notes</label>
                                <textarea
                                    value={form.admin_notes}
                                    onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Internal notes visible to admin only"
                                />
                            </div>
                            {form.status === 'RESOLVED' && (
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Refund Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.refund_amount}
                                        onChange={e => setForm(f => ({ ...f, refund_amount: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00 (leave blank for no refund)"
                                    />
                                </div>
                            )}
                            {error && <p className="text-sm text-red-600">{error}</p>}
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
