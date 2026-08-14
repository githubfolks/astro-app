import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cms } from '../../services/api';
import { Button, Input, Card } from '../../components/ui';
import { ChevronLeft } from 'lucide-react';

const SIGNS = [
    'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
    'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
];
const PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

// For a yearly entry, `date` is stored as Jan 1 of that year — the model's
// `date` column is what the public API filters on, and yearly content is
// identified by year alone, so the day/month within it is arbitrary.
const defaultDateFor = (period) => {
    const now = new Date();
    if (period === 'YEARLY') return `${now.getFullYear()}-01-01`;
    return now.toISOString().slice(0, 10);
};

export default function HoroscopeEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [sign, setSign] = useState('ARIES');
    const [period, setPeriod] = useState('YEARLY');
    const [date, setDate] = useState(defaultDateFor('YEARLY'));
    const [content, setContent] = useState({ overview: '', love: '', career: '', health: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isEdit) return;
        cms.horoscopes.get(id).then((res) => {
            setSign(res.data.sign);
            setPeriod(res.data.period);
            setDate(res.data.date);
            setContent({
                overview: res.data.content?.overview || '',
                love: res.data.content?.love || '',
                career: res.data.content?.career || '',
                health: res.data.content?.health || '',
            });
        }).catch((error) => console.error('Failed to fetch horoscope', error));
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanContent = Object.fromEntries(
            Object.entries(content).filter(([, v]) => v.trim())
        );
        setSaving(true);
        try {
            if (isEdit) {
                await cms.horoscopes.update(id, { content: cleanContent });
            } else {
                await cms.horoscopes.create({ sign, period, date, content: cleanContent });
            }
            navigate('/cms/horoscopes');
        } catch (error) {
            alert(error.message || 'Failed to save horoscope');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 w-full p-2 max-w-3xl">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <button
                    onClick={() => navigate('/cms/horoscopes')}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-900 cursor-pointer"
                    title="Back to horoscopes"
                    type="button"
                >
                    <ChevronLeft size={18} />
                </button>
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Content / Horoscopes</span>
                    <h1 className="text-2xl text-slate-800">{isEdit ? 'Edit Horoscope' : 'New Horoscope'}</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6 border border-slate-200 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Sign</label>
                            <select
                                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                value={sign}
                                onChange={(e) => setSign(e.target.value)}
                                disabled={isEdit}
                            >
                                {SIGNS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Period</label>
                            <select
                                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                value={period}
                                onChange={(e) => { setPeriod(e.target.value); setDate(defaultDateFor(e.target.value)); }}
                                disabled={isEdit}
                            >
                                {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <Input
                            label={period === 'YEARLY' ? 'Year start date' : 'Date'}
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={isEdit}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Overview</label>
                        <textarea
                            className="w-full text-sm border border-slate-200 rounded-lg p-3 h-28 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="The main forecast shown at the top of the page..."
                            value={content.overview}
                            onChange={(e) => setContent((c) => ({ ...c, overview: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Love & Relations</label>
                        <textarea
                            className="w-full text-sm border border-slate-200 rounded-lg p-3 h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            value={content.love}
                            onChange={(e) => setContent((c) => ({ ...c, love: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Career & Finance</label>
                        <textarea
                            className="w-full text-sm border border-slate-200 rounded-lg p-3 h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            value={content.career}
                            onChange={(e) => setContent((c) => ({ ...c, career: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Health & Vigor</label>
                        <textarea
                            className="w-full text-sm border border-slate-200 rounded-lg p-3 h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            value={content.health}
                            onChange={(e) => setContent((c) => ({ ...c, health: e.target.value }))}
                        />
                    </div>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Button variant="outlined" onClick={() => navigate('/cms/horoscopes')} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Horoscope'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
