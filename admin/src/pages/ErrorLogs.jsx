import React, { useEffect, useState, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function ErrorLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [total, setTotal] = useState(0);

    const [pathFilter, setPathFilter] = useState("");
    const [errorTypeFilter, setErrorTypeFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { offset: page * rowsPerPage, limit: rowsPerPage };
            if (pathFilter) params.path = pathFilter;
            if (errorTypeFilter) params.error_type = errorTypeFilter;
            if (sourceFilter) params.source = sourceFilter;

            const response = await api.get('/admin/error-logs', { params });
            setLogs(response.data.logs);
            setTotal(response.data.total);
        } catch (error) {
            console.error("Failed to fetch error logs", error);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, pathFilter, errorTypeFilter, sourceFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [pathFilter, errorTypeFilter, sourceFilter, fetchLogs]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Error Logs</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Unhandled server exceptions (500s) and frontend crash reports (uncaught JS
                    errors, unhandled promise rejections, React render crashes), captured with
                    the full traceback and the user who triggered them, if authenticated.
                </p>
            </div>

            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Input
                            label="Path contains"
                            value={pathFilter}
                            onChange={(e) => setPathFilter(e.target.value)}
                            placeholder="e.g. /payment or /consultations"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <Input
                            label="Error type contains"
                            value={errorTypeFilter}
                            onChange={(e) => setErrorTypeFilter(e.target.value)}
                            placeholder="e.g. KeyError, ValueError"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                        <select
                            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="server">Server</option>
                            <option value="client">Client (app)</option>
                        </select>
                    </div>

                    <Button onClick={fetchLogs}>
                        <RefreshCw size={16} className="mr-2" /> Refresh
                    </Button>
                </div>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Path</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Error Type</TableHead>
                            <TableHead>Message</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((l) => (
                            <TableRow
                                key={l.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => setSelected(l)}
                            >
                                <TableCell className="whitespace-nowrap">
                                    {new Date(l.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${l.source === 'client' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {l.source === 'client' ? 'App' : 'Server'}
                                    </span>
                                </TableCell>
                                <TableCell>{l.method}</TableCell>
                                <TableCell className="font-mono text-xs">{l.path}</TableCell>
                                <TableCell>{l.user_id ?? '-'}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                                        {l.error_type}
                                    </span>
                                </TableCell>
                                <TableCell className="max-w-[320px] truncate" title={l.message || ''}>
                                    {l.message || '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-900">
                                    No error logs found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-900">
                        Showing {total === 0 ? 0 : page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, total)} of {total} entries
                    </div>
                    <div className="flex items-center space-x-2">
                        <select
                            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(0);
                            }}
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                        <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={(page + 1) * rowsPerPage >= total}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Error Detail" className="max-w-2xl">
                {selected && (
                    <div className="space-y-3 text-sm">
                        <div><span className="font-medium">Date:</span> {new Date(selected.created_at).toLocaleString()}</div>
                        <div><span className="font-medium">Source:</span> {selected.source === 'client' ? 'App (client)' : 'Server'}</div>
                        <div><span className="font-medium">Request:</span> {selected.method} {selected.path}</div>
                        <div><span className="font-medium">User ID:</span> {selected.user_id ?? 'unauthenticated'}</div>
                        <div><span className="font-medium">Type:</span> {selected.error_type}</div>
                        <div><span className="font-medium">Message:</span> {selected.message || '-'}</div>
                        <div>
                            <div className="font-medium mb-1">Traceback:</div>
                            <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-md overflow-auto max-h-96 whitespace-pre-wrap">
                                {selected.traceback || '-'}
                            </pre>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
