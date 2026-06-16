import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cms } from '../../services/api';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Button, Input, TextArea, Card } from '../../components/ui';

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
            // Placeholder for fetching horoscope logic
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Horoscope' : 'New Horoscope Entry'}</h1>
                <div className="flex gap-2">
                    <Button variant="outlined" onClick={() => navigate('/cms/horoscopes')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Save
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1.5">Sign</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                                value={formData.sign}
                                onChange={(e) => setFormData({ ...formData, sign: e.target.value })}
                                disabled={isEdit}
                            >
                                {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1.5">Period</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                                value={formData.period}
                                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                disabled={isEdit}
                            >
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                                <option value="YEARLY">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <Input
                                type="date"
                                label="Date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                disabled={isEdit}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">General Prediction</label>
                            <RichTextEditor
                                value={formData.content.general}
                                onChange={(val) => setContent('general', val)}
                                className="h-[300px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextArea
                                label="Love Prediction"
                                value={formData.content.love}
                                onChange={(e) => setContent('love', e.target.value)}
                                rows={6}
                            />
                            <TextArea
                                label="Career Prediction"
                                value={formData.content.career}
                                onChange={(e) => setContent('career', e.target.value)}
                                rows={6}
                            />
                        </div>
                    </div>
                </Card>
            </form>
        </div>
    );
}
