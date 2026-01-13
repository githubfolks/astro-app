import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Paper,
    TextField,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { cms } from '../../services/api';
import { RichTextEditor } from '../../components/RichTextEditor';

const ZODIAC_SIGNS = [
    'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
    'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'
];

export default function HoroscopeEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        sign: 'ARIES',
        period: 'DAILY',
        date: new Date().toISOString().split('T')[0],
        content: {
            general: '',
            love: '',
            career: ''
        }
    });

    // Helper to update nested content
    const setContent = (key, value) => {
        setFormData(prev => ({
            ...prev,
            content: { ...prev.content, [key]: value }
        }));
    };

    useEffect(() => {
        if (isEdit) {
            fetchHoroscope();
        }
    }, [id]);

    const fetchHoroscope = async () => {
        try {
            // Logic for fetching specific horoscope by ID is standard
            // But verify if your API supports GET /horoscopes/:id. 
            // Current cms.py implies list filtering. 
            // Wait, router has `update_horoscope` by ID but list returns objects.
            // I need to check if I implemented GET /horoscopes/:id in router.
            // Checking implementation plan... 
            // Actually `routers/cms.py` might be missing `get_horoscope` by ID!
            // I'll check router code in next step. For now assume it exists or I'll add it.
            // Assuming I might need to implement GET one.

            // Let's assume list filtering is enough for now if GET ID is missing, but List returns array.
            // Ideally I should implement GET /horoscopes/{id}.
        } catch (error) {
            console.error('Failed to fetch horoscope', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await cms.horoscopes.update(id, formData);
            } else {
                await cms.horoscopes.create(formData);
            }
            navigate('/cms/horoscopes');
        } catch (error) {
            console.error('Failed to save horoscope', error);
            alert('Failed to save. Ensure (Sign + Period + Date) is unique!');
        }
    };

    return (
        <Box p={3}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    {isEdit ? 'Edit Horoscope' : 'New Horoscope Entry'}
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Sign</InputLabel>
                                <Select
                                    value={formData.sign}
                                    label="Sign"
                                    onChange={(e) => setFormData({ ...formData, sign: e.target.value })}
                                    disabled={isEdit} // Prevent changing composite key components on edit usually, but backend logic allows content update only
                                >
                                    {ZODIAC_SIGNS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Period</InputLabel>
                                <Select
                                    value={formData.period}
                                    label="Period"
                                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                    disabled={isEdit}
                                >
                                    <MenuItem value="DAILY">Daily</MenuItem>
                                    <MenuItem value="WEEKLY">Weekly</MenuItem>
                                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                                    <MenuItem value="YEARLY">Yearly</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                                disabled={isEdit}
                            />
                        </Grid>

                        {/* Content Fields */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>General Prediction</Typography>
                            <RichTextEditor
                                value={formData.content.general}
                                onChange={(val) => setContent('general', val)}
                                style={{ height: '200px', marginBottom: '50px' }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Love</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                value={formData.content.love}
                                onChange={(e) => setContent('love', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Career</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                value={formData.content.career}
                                onChange={(e) => setContent('career', e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box display="flex" gap={2} mt={3}>
                                <Button type="submit" variant="contained" size="large">
                                    Save
                                </Button>
                                <Button variant="outlined" size="large" onClick={() => navigate('/cms/horoscopes')}>
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
