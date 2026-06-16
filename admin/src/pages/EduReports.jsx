import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../components/ui/Table';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RefreshCw, Users, DollarSign, Calendar, Eye } from 'lucide-react';
import { edu } from '../services/api';
import clsx from 'clsx';

export default function EduReports() {
    const [stats, setStats] = useState({
        total_enrollments: 0,
        total_earnings: 0,
        enrollments: []
    });
    const [loading, setLoading] = useState(false);
    const [days, setDays] = useState(30);
    const navigate = useNavigate();

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await edu.getStats({ days });
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch edu stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [days]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Education Reports</h1>
                <div className="flex items-center gap-3">
                    <select 
                        className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                    >
                        <option value={10}>Last 10 Days</option>
                        <option value={20}>Last 20 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={0}>All Time</option>
                    </select>
                    <Button onClick={fetchStats} disabled={loading}>
                        <RefreshCw size={16} className={clsx("mr-2", loading && "animate-spin")} /> 
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.total_enrollments}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center space-x-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_earnings)}</h3>
                    </div>
                </Card>
            </div>

            {/* Enrollment Table */}
            <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700">Recent Enrollments</h3>
                    <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        Showing activity for last {days || 'all'} days
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student Email</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead>Enrolled At</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.enrollments.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.user_email}</TableCell>
                                <TableCell>{item.course_title}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        {item.batch_name}
                                    </span>
                                </TableCell>
                                <TableCell className="text-gray-500">{formatDate(item.enrolled_at)}</TableCell>
                                <TableCell className="text-right font-semibold text-gray-900">
                                    {formatCurrency(item.price)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => navigate(`/users/view/${item.user_id}`)}
                                        title="View Student Details"
                                    >
                                        <Eye size={18} className="text-blue-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {stats.enrollments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-500 italic">
                                    No enrollments found for this period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
