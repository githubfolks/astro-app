import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { cms } from '../../services/api';

const ZODIAC_SIGNS = [
    'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
    'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'
];

export default function HoroscopeList() {
    const [horoscopes, setHoroscopes] = useState([]);
    const [sign, setSign] = useState('');
    const [period, setPeriod] = useState('DAILY');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHoroscopes();
    }, [sign, period, date]);

    const fetchHoroscopes = async () => {
        try {
            const params = { period, date };
            if (sign) params.sign = sign;

            const response = await cms.horoscopes.list(params);
            setHoroscopes(response.data);
        } catch (error) {
            console.error('Failed to fetch horoscopes', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this horoscope?')) {
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
                    <Plus size={16} className="mr-2" /> New Entry
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="w-full sm:w-48">
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Period</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                    </select>
                </div>
                <div className="w-full sm:w-48">
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Sign</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={sign}
                        onChange={(e) => setSign(e.target.value)}
                    >
                        <option value="">All</option>
                        {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="w-full sm:w-48">
                    <Input
                        type="date"
                        label="Date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sign</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {horoscopes.map((h) => (
                            <TableRow key={h.id}>
                                <TableCell className="font-medium">{h.sign}</TableCell>
                                <TableCell>{h.period}</TableCell>
                                <TableCell>{h.date}</TableCell>
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
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    No horoscopes found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
