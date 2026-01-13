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
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
    }, [sign, period, date]); // Auto-fetch on filter change

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
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Horoscopes</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/cms/horoscopes/new')}
                >
                    New Entry
                </Button>
            </Box>

            <Box display="flex" gap={2} mb={3}>
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Period</InputLabel>
                    <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
                        <MenuItem value="DAILY">Daily</MenuItem>
                        <MenuItem value="WEEKLY">Weekly</MenuItem>
                        <MenuItem value="MONTHLY">Monthly</MenuItem>
                        <MenuItem value="YEARLY">Yearly</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Sign</InputLabel>
                    <Select value={sign} label="Sign" onChange={(e) => setSign(e.target.value)}>
                        <MenuItem value="">All</MenuItem>
                        {ZODIAC_SIGNS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                </FormControl>
                <TextField
                    type="date"
                    label="Date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Sign</TableCell>
                            <TableCell>Period</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {horoscopes.map((h) => (
                            <TableRow key={h.id}>
                                <TableCell>{h.sign}</TableCell>
                                <TableCell>{h.period}</TableCell>
                                <TableCell>{h.date}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => navigate(`/cms/horoscopes/edit/${h.id}`)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(h.id)} color="error">
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
