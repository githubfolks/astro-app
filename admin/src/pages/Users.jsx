import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, Chip, IconButton, TablePagination,
    TextField, MenuItem, Select, FormControl, InputLabel, Stack, Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../services/api';

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
    const [filterRole, setFilterRole] = useState("SEEKER"); // Default to SEEKER
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

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
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
            // Need to optimistically update or re-fetch
            const newStatus = !user.is_active;
            // Optimistic update
            setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));

            await api.put(`/admin/users/${user.id}/status`, { is_active: newStatus });
        } catch (error) {
            console.error("Status update failed", error);
            fetchUsers(); // Revert on failure
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                User Management
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        label="Search Email/Phone"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={filterRole}
                            label="Role"
                            onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}
                        >
                            <MenuItem value="">All Roles</MenuItem>
                            <MenuItem value="SEEKER">Seeker</MenuItem>
                            <MenuItem value="ASTROLOGER">Astrologer</MenuItem>
                            <MenuItem value="ADMIN">Admin</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Verified</InputLabel>
                        <Select
                            value={filterVerified}
                            label="Verified"
                            onChange={(e) => { setFilterVerified(e.target.value); setPage(0); }}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="true">Verified</MenuItem>
                            <MenuItem value="false">Unverified</MenuItem>
                        </Select>
                    </FormControl>

                    <Button variant="contained" onClick={fetchUsers}>
                        Refresh
                    </Button>
                </Stack>
            </Paper>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Verified</TableCell>
                            <TableCell>Active</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow
                                key={user.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {user.id}
                                </TableCell>
                                <TableCell>{user.email || '-'}</TableCell>
                                <TableCell>{user.phone_number || '-'}</TableCell>
                                <TableCell>
                                    <Chip label={user.role} color={user.role === 'ADMIN' ? 'error' : user.role === 'ASTROLOGER' ? 'secondary' : 'default'} size="small" />
                                </TableCell>
                                <TableCell>
                                    {user.is_verified ? (
                                        <CheckCircleIcon color="success" />
                                    ) : (
                                        <Button size="small" variant="outlined" onClick={() => handleVerify(user.id)}>Verify</Button>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={user.is_active !== false} // Default true if undefined/null? Backend defaults to True.
                                        onChange={() => handleToggleStatus(user)}
                                        color="primary"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => navigate(`/users/view/${user.id}`)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(user.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No users found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        </Box>
    );
}
