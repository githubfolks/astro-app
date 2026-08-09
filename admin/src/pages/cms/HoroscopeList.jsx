import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { cms } from '../../services/api';

const PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

export default function HoroscopeList() {
    const [horoscopes, setHoroscopes] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [period, setPeriod] = useState('');
    const limit = 20;
    const navigate = useNavigate();

    const fetchHoroscopes = useCallback(async () => {
        try {
            const response = await cms.horoscopes.list({
                skip: (page - 1) * limit,
                limit,
                ...(period ? { period } : {}),
            });
            setHoroscopes(response.data.horoscopes);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Failed to fetch horoscopes', error);
        }
    }, [page, period]);

    useEffect(() => {
        fetchHoroscopes();
    }, [fetchHoroscopes]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this horoscope entry?')) {
            try {
                await cms.horoscopes.delete(id);
                fetchHoroscopes();
            } catch (error) {
                console.error('Failed to delete horoscope', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Horoscopes</h1>
                <Button onClick={() => navigate('/cms/horoscopes/new')}>
                    <Plus size={16} className="mr-2" /> New Horoscope
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Filter by period:</label>
                <select
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={period}
                    onChange={(e) => { setPage(1); setPeriod(e.target.value); }}
                >
                    <option value="">All</option>
                    {PERIODS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sign</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Overview</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {horoscopes.map((h) => (
                            <TableRow key={h.id}>
                                <TableCell className="font-medium">{h.sign}</TableCell>
                                <TableCell>{h.period}</TableCell>
                                <TableCell>{h.date}</TableCell>
                                <TableCell className="max-w-xs truncate">{h.content?.overview || '—'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/cms/horoscopes/edit/${h.id}`)}>
                                        <Edit2 size={18} className="text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(h.id)}>
                                        <Trash2 size={18} className="text-red-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {horoscopes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-900">
                                    No horoscope entries found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {Math.ceil(total / limit) > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <div className="text-sm text-gray-900">
                            Page {page} of {Math.ceil(total / limit)}
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outlined"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outlined"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil(total / limit)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
