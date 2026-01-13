import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Paper,
    TextField,
    Typography,
    Grid,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { cms } from '../../services/api';
import { RichTextEditor } from '../../components/RichTextEditor';

export default function PageEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        seo_title: '',
        seo_description: '',
    });

    useEffect(() => {
        if (isEdit) {
            fetchPage();
        }
    }, [id]);

    const fetchPage = async () => {
        try {
            const response = await cms.pages.get(id);
            setFormData({
                title: response.data.title,
                content: response.data.content,
                seo_title: response.data.seo_title || '',
                seo_description: response.data.seo_description || '',
            });
        } catch (error) {
            console.error('Failed to fetch page', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await cms.pages.update(id, formData);
            } else {
                await cms.pages.create(formData);
            }
            navigate('/cms/pages');
        } catch (error) {
            console.error('Failed to save page', error);
        }
    };

    return (
        <Box p={3}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    {isEdit ? 'Edit Page' : 'New Page'}
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
                                style={{ height: '400px', marginBottom: '50px' }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" mt={2}>SEO Settings</Typography>
                            <TextField
                                fullWidth
                                label="SEO Title"
                                value={formData.seo_title}
                                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="SEO Description"
                                value={formData.seo_description}
                                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                                margin="normal"
                                multiline
                                rows={4}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" gap={2} mt={3}>
                                <Button type="submit" variant="contained" size="large">
                                    Save
                                </Button>
                                <Button variant="outlined" size="large" onClick={() => navigate('/cms/pages')}>
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
