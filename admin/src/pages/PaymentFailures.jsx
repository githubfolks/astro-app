import React, { useEffect, useState, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function PaymentFailures() {
    const [failures, setFailures] = useState([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [total, setTotal] = useState(0);

    const [searchQuery, setSearchQuery] = useState("");

    const fetchFailures = useCallback(async () => {
        setLoading(true);
        try {
            const params = { offset: page * rowsPerPage, limit: rowsPerPage };
            if (searchQuery) params.search = searchQuery;

            const response = await api.get('/admin/payment-failures', { params });
            setFailures(response.data.failures);
            setTotal(response.data.total);
        } catch (error) {
            console.error("Failed to fetch payment failures", error);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchQuery]);

    useEffect(() => {
        fetchFailures();
    }, [fetchFailures]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchFailures();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchFailures]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl text-gray-900">Payment Failures</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Razorpay checkouts that failed (card declined, cancelled, etc.) or the failure webhook —
                    use this to check a customer's "money was deducted" claim against what Razorpay actually reported.
                </p>
            </div>

            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Input
                            label="Search Name/Email/Phone/Order ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter name, email, phone or order_..."
                        />
                    </div>

                    <Button onClick={fetchFailures}>
                        <RefreshCw size={16} className="mr-2" /> Refresh
                    </Button>
                </div>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Source</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {failures.map((f) => (
                            <TableRow key={f.id}>
                                <TableCell className="whitespace-nowrap">
                                    {new Date(f.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>{f.user_name}</TableCell>
                                <TableCell>
                                    <div className="text-sm">{f.email || '-'}</div>
                                    <div className="text-xs text-gray-500">{f.phone_number || '-'}</div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{f.order_id || '-'}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                                        {f.code || 'unknown'}
                                    </span>
                                </TableCell>
                                <TableCell className="max-w-[280px] truncate" title={f.description || ''}>
                                    {f.description || '-'}
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">{f.source || '-'}</TableCell>
                            </TableRow>
                        ))}
                        {!loading && failures.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-900">
                                    No payment failures found
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
        </div>
    );
}
