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
    Chip,
    IconButton,
    Pagination
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cms } from '../services/api';

export default function PostList() {
    const [posts, setPosts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, [page]);

    const fetchPosts = async () => {
        try {
            const response = await cms.posts.list({ skip: (page - 1) * 20, limit: 20 });
            setPosts(response.data.posts);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await cms.posts.delete(id);
                fetchPosts();
            } catch (error) {
                console.error('Failed to delete post', error);
            }
        }
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Blog Posts</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/cms/posts/new')}
                >
                    New Post
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {posts.map((post) => (
                            <TableRow key={post.id}>
                                <TableCell>{post.title}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={post.status}
                                        color={post.status === 'PUBLISHED' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => navigate(`/cms/posts/edit/${post.id}`)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(post.id)} color="error">
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
