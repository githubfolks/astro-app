import React, { useEffect, useState, useCallback } from 'react';
import { moderation } from '../services/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
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
    const [selectedFlag, setSelectedFlag] = useState(null);

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
                <h1 className="text-2xl text-gray-900 flex items-center gap-2">
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
                                <th className="p-3">Seeker</th>
                                <th className="p-3">Astrologer</th>
                                <th className="p-3">Flagged User</th>
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
                                    <td className="p-3">{f.seeker_name || '-'}</td>
                                    <td className="p-3">{f.astrologer_name || '-'}</td>
                                    <td className="p-3 font-medium text-gray-900">{f.flagged_user_name || `#${f.flagged_user_id}`}</td>
                                    <td className="p-3"><span className="font-mono text-xs text-red-600">{f.reason}</span></td>
                                    <td className="p-3 max-w-xs">
                                        <button
                                            onClick={() => setSelectedFlag(f)}
                                            className="truncate block max-w-xs text-left text-gray-700 hover:text-indigo-600 hover:underline"
                                            title="Click to view full snippet"
                                        >
                                            {f.snippet}
                                        </button>
                                    </td>
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

            <Modal isOpen={!!selectedFlag} onClose={() => setSelectedFlag(null)} title="Flagged Message Snippet" className="max-w-2xl">
                {selectedFlag && (
                    <div className="space-y-3 text-sm">
                        <div><span className="font-medium">When:</span> {selectedFlag.created_at ? new Date(selectedFlag.created_at).toLocaleString() : '-'}</div>
                        <div><span className="font-medium">Consultation:</span> #{selectedFlag.consultation_id}</div>
                        <div><span className="font-medium">Seeker:</span> {selectedFlag.seeker_name || '-'}</div>
                        <div><span className="font-medium">Astrologer:</span> {selectedFlag.astrologer_name || '-'}</div>
                        <div><span className="font-medium">Flagged User:</span> {selectedFlag.flagged_user_name || `#${selectedFlag.flagged_user_id}`}</div>
                        <div><span className="font-medium">Reason:</span> <span className="font-mono text-xs text-red-600">{selectedFlag.reason}</span></div>
                        <div>
                            <div className="font-medium mb-1">Snippet:</div>
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-800 whitespace-pre-wrap break-words">
                                {selectedFlag.snippet}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
