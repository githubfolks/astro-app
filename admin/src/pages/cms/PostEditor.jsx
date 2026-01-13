import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Paper,
    TextField,
    Typography,
    MenuItem,
    Grid,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { cms } from '../../services/api';
import { RichTextEditor } from '../../components/RichTextEditor';

export default function PostEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        featured_image: '',
        status: 'DRAFT',
    });

    useEffect(() => {
        if (isEdit) {
            fetchPost();
        }
    }, [id]);

    const fetchPost = async () => {
        try {
            const response = await cms.posts.get(id);
            setFormData({
                title: response.data.title,
                content: response.data.content,
                featured_image: response.data.featured_image || '',
                status: response.data.status,
            });
        } catch (error) {
            console.error('Failed to fetch post', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await cms.posts.update(id, formData);
            } else {
                await cms.posts.create(formData);
            }
            navigate('/cms/posts');
        } catch (error) {
            console.error('Failed to save post', error);
        }
    };

    return (
        <Box p={3}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    {isEdit ? 'Edit Post' : 'New Post'}
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                margin="normal"
                            />

                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Content</Typography>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                style={{ height: '300px', marginBottom: '50px' }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status}
                                    label="Status"
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <MenuItem value="DRAFT">Draft</MenuItem>
                                    <MenuItem value="PUBLISHED">Published</MenuItem>
                                    <MenuItem value="ARCHIVED">Archived</MenuItem>
                                </Select>
                            </FormControl>

                            label="Featured Image URL"
                            value={formData.featured_image}
                            onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                            margin="normal"
                            />
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                sx={{ mt: 1 }}
                            >
                                Upload Image
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const uploadData = new FormData();
                                            uploadData.append('file', file);
                                            try {
                                                const res = await cms.upload(uploadData);
                                                // Prepend API URL if it's relative
                                                const url = res.data.url.startsWith('http') ? res.data.url : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${res.data.url}`;
                                                setFormData(prev => ({ ...prev, featured_image: url }));
                                            } catch (err) {
                                                console.error("Upload failed", err);
                                                alert("Upload failed");
                                            }
                                        }
                                    }}
                                />
                            </Button>
                            {formData.featured_image && (
                                <Box mt={2}>
                                    <img src={formData.featured_image} alt="Preview" style={{ width: '100%', borderRadius: 4 }} />
                                </Box>
                            )}
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" gap={2} mt={3}>
                                <Button type="submit" variant="contained" size="large">
                                    Save
                                </Button>
                                <Button variant="outlined" size="large" onClick={() => navigate('/cms/posts')}>
                                    Cancel
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
}
