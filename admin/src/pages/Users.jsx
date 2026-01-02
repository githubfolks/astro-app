import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';

export default function Users() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await api.delete(`/admin/users/${userId}`);
                fetchUsers(); // Refresh
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

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                User Management
            </Typography>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Verified</TableCell>
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
                                <TableCell align="right">
                                    <IconButton color="error" onClick={() => handleDelete(user.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
