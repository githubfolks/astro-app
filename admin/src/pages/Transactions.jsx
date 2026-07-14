import React, { useEffect, useState, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { RefreshCw } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

const TRANSACTION_TYPES = [
    'DEPOSIT', 'WITHDRAWAL', 'CHAT_DEDUCTION', 'CHAT_REFUND',
    'PAYMENT_GATEWAY', 'COURSE_PURCHASE', 'PACKAGE_PURCHASE'
];

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [total, setTotal] = useState(0);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("SEEKER");
    const [filterType, setFilterType] = useState("");

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
                role: filterRole,
            };
            if (searchQuery) params.search = searchQuery;
            if (filterType) params.transaction_type = filterType;

            const response = await api.get('/admin/transactions', { params });
            setTransactions(response.data.transactions);
            setTotal(response.data.total);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchQuery, filterRole, filterType]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchTransactions();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchTransactions]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Seeker Transactions</h1>

            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Input
                            label="Search Name/Email/Phone"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter name, email or phone..."
                        />
                    </div>

                    <div className="w-full sm:w-48">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Role</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={filterRole}
                            onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}
                        >
                            <option value="SEEKER">Seeker</option>
                            <option value="ASTROLOGER">Astrologer</option>
                        </select>
                    </div>

                    <div className="w-full sm:w-56">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Transaction Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
                        >
                            <option value="">All Types</option>
                            {TRANSACTION_TYPES.map(t => (
                                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>

                    <Button onClick={fetchTransactions}>
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
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((txn) => (
                            <TableRow key={txn.id}>
                                <TableCell className="whitespace-nowrap">
                                    {new Date(txn.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>{txn.user_name}</TableCell>
                                <TableCell>
                                    <div className="text-sm">{txn.email || '-'}</div>
                                    <div className="text-xs text-gray-500">{txn.phone_number || '-'}</div>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                                        {txn.transaction_type}
                                    </span>
                                </TableCell>
                                <TableCell className={clsx(
                                    "font-medium",
                                    txn.amount >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {txn.amount >= 0 ? '+' : ''}₹{parseFloat(txn.amount).toFixed(2)}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{txn.reference_id || '-'}</TableCell>
                                <TableCell className="max-w-[240px] truncate" title={txn.description || ''}>
                                    {txn.description || '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && transactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-900">
                                    No transactions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
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
