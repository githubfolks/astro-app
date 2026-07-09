import React, { useEffect, useState, useCallback } from 'react';
import { moderation } from '../services/api';
import { Button } from '../components/ui/Button';
import { AlertTriangle } from 'lucide-react';

const STATUS_COLORS = {
    OPEN: 'bg-red-100 text-red-800',
    REVIEWED: 'bg-green-100 text-green-800',
    DISMISSED: 'bg-gray-100 text-gray-700',
};

export default function ModerationFlags() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');

    const fetchFlags = useCallback(async () => {
        try {
            setLoading(true);
            const res = await moderation.list(filterStatus ? { status: filterStatus } : {});
            setItems(res.data.flags || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => { fetchFlags(); }, [fetchFlags]);

    const resolve = async (id, status) => {
        try {
            await moderation.resolve(id, status);
            fetchFlags();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="text-red-500" /> Moderation Flags
                </h1>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="">All</option>
                    <option value="OPEN">Open</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="DISMISSED">Dismissed</option>
                </select>
            </div>

            {loading ? (
                <p className="text-gray-900">Loading…</p>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-900">No flags found.</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-900">
                            <tr>
                                <th className="p-3">When</th>
                                <th className="p-3">Consultation</th>
                                <th className="p-3">User</th>
                                <th className="p-3">Reason</th>
                                <th className="p-3">Snippet</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map(f => (
                                <tr key={f.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-gray-900">{f.created_at ? new Date(f.created_at).toLocaleString() : '-'}</td>
                                    <td className="p-3">#{f.consultation_id}</td>
                                    <td className="p-3">#{f.flagged_user_id}</td>
                                    <td className="p-3"><span className="font-mono text-xs text-red-600">{f.reason}</span></td>
                                    <td className="p-3 max-w-xs truncate text-gray-700" title={f.snippet}>{f.snippet}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[f.status] || ''}`}>{f.status}</span>
                                    </td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                        {f.status === 'OPEN' && (
                                            <div className="flex gap-2 justify-end">
                                                <Button onClick={() => resolve(f.id, 'REVIEWED')} className="text-xs">Mark Reviewed</Button>
                                                <button onClick={() => resolve(f.id, 'DISMISSED')} className="text-xs text-gray-900 hover:text-gray-700">Dismiss</button>
                                            </div>
                                        )}
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
