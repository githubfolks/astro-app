import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    Pagination
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cms } from '../../services/api';

export default function PageList() {
    const [pages, setPages] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPages();
    }, [page]);

    const fetchPages = async () => {
        try {
            const response = await cms.pages.list({ skip: (page - 1) * 20, limit: 20 });
            setPages(response.data.pages);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Failed to fetch pages', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this page?')) {
            try {
                await cms.pages.delete(id);
                fetchPages();
            } catch (error) {
                console.error('Failed to delete page', error);
            }
        }
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Static Pages</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/cms/pages/new')}
                >
                    New Page
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Slug</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pages.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell>{p.title}</TableCell>
                                <TableCell>{p.slug}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => navigate(`/cms/pages/edit/${p.id}`)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(p.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                    count={Math.ceil(total / 20)}
                    page={page}
                    onChange={(e, v) => setPage(v)}
                />
            </Box>
        </Box>
    );
}
