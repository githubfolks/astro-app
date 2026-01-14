import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Card } from '../components/ui/Card';
import { Trash2, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("SEEKER");
    const [filterVerified, setFilterVerified] = useState("");

    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage, filterRole, filterVerified]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                skip: page * rowsPerPage,
                limit: rowsPerPage,
            };

            if (searchQuery) params.search = searchQuery;
            if (filterRole) params.role = filterRole;
            if (filterVerified) params.is_verified = filterVerified;

            const response = await api.get('/admin/users', { params });
            setUsers(response.data.users);
            setTotalUsers(response.data.total);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await api.delete(`/admin/users/${userId}`);
                fetchUsers();
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    const handleVerify = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/verify`);
            fetchUsers();
        } catch (error) {
            console.error("Verify failed", error);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = !user.is_active;
            setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
            await api.put(`/admin/users/${user.id}/status`, { is_active: newStatus });
        } catch (error) {
            console.error("Status update failed", error);
            fetchUsers();
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>

            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Input
                            label="Search Email/Phone"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter email or phone..."
                        />
                    </div>

                    <div className="w-full sm:w-48">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Role</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={filterRole}
                            onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}
                        >
                            <option value="">All Roles</option>
                            <option value="SEEKER">Seeker</option>
                            <option value="ASTROLOGER">Astrologer</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <div className="w-full sm:w-48">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Verified</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={filterVerified}
                            onChange={(e) => { setFilterVerified(e.target.value); setPage(0); }}
                        >
                            <option value="">All</option>
                            <option value="true">Verified</option>
                            <option value="false">Unverified</option>
                        </select>
                    </div>

                    <Button onClick={fetchUsers}>
                        <RefreshCw size={16} className="mr-2" /> Refresh
                    </Button>
                </div>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.id}</TableCell>
                                <TableCell>{user.email || '-'}</TableCell>
                                <TableCell>{user.phone_number || '-'}</TableCell>
                                <TableCell>
                                    <span className={clsx(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                        user.role === 'ADMIN' ? "bg-red-100 text-red-800" :
                                            user.role === 'ASTROLOGER' ? "bg-purple-100 text-purple-800" :
                                                "bg-gray-100 text-gray-800"
                                    )}>
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {user.is_verified ? (
                                        <CheckCircle size={20} className="text-green-500" />
                                    ) : (
                                        <Button variant="outlined" size="sm" onClick={() => handleVerify(user.id)}>
                                            Verify
                                        </Button>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={user.is_active !== false}
                                        onCheckedChange={() => handleToggleStatus(user)}
                                    />
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/users/view/${user.id}`)}>
                                        <Eye size={18} className="text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                                        <Trash2 size={18} className="text-red-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    No users found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500">
                        Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, totalUsers)} of {totalUsers} entries
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
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
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
                            disabled={(page + 1) * rowsPerPage >= totalUsers}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
