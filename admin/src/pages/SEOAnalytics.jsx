import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, BarChart2, MousePointerClick, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function SEOAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/seo/analytics');
            setData(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to fetch SEO analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-slate-500">Loading SEO Analytics...</div>;
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow-sm border border-red-100 flex items-start max-w-4xl">
                    <AlertCircle className="mr-3 shrink-0" />
                    <div>
                        <h2 className="text-lg font-bold">Google Search Console Not Configured</h2>
                        <p className="mt-1 text-sm">{error}</p>
                        <div className="mt-4 text-sm text-red-800">
                            <strong>To fix this:</strong>
                            <ol className="list-decimal ml-5 mt-2 space-y-1">
                                <li>Create a Service Account in Google Cloud.</li>
                                <li>Enable the Google Search Console API.</li>
                                <li>Add the Service Account email to your GSC property as a Delegated Owner or Restricted User.</li>
                                <li>Provide the JSON key to the backend environment (`GSC_CREDENTIALS_JSON`).</li>
                            </ol>
                        </div>
                        <Button onClick={fetchAnalytics} className="mt-4 bg-red-600 hover:bg-red-700">Retry Connection</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!data?.configured) return null;

    const statCards = [
        { label: 'Total Clicks', value: data.summary.clicks, icon: MousePointerClick, color: 'text-blue-600' },
        { label: 'Total Impressions', value: data.summary.impressions, icon: BarChart2, color: 'text-indigo-600' },
        { label: 'Average CTR', value: `${data.summary.ctr}%`, icon: TrendingUp, color: 'text-green-600' },
        { label: 'Avg Position', value: data.summary.position, icon: ArrowUpRight, color: 'text-orange-600' }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">SEO & PR Hub</h1>
                    <p className="text-slate-500 mt-1">Google Search Console performance over the last 30 days.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full bg-slate-50 ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Traffic Trend (30 Days)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.daily}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => val.slice(5)} />
                            <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#2563EB" strokeWidth={3} dot={false} name="Clicks" />
                            <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#818CF8" strokeWidth={2} dot={false} name="Impressions" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-900">Top Queries</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {data.top_queries.map((q, i) => (
                            <div key={i} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50">
                                <span className="font-medium text-slate-700 truncate mr-4">{q.query}</span>
                                <div className="text-right whitespace-nowrap">
                                    <div className="text-sm font-bold text-slate-900">{q.clicks} clicks</div>
                                    <div className="text-xs text-slate-500">{q.impressions} imp</div>
                                </div>
                            </div>
                        ))}
                        {data.top_queries.length === 0 && <div className="p-6 text-center text-slate-500">No query data available.</div>}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-bold text-slate-900">Top Pages</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {data.top_pages.map((p, i) => (
                            <div key={i} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50">
                                <span className="font-medium text-slate-700 truncate mr-4 max-w-[200px]" title={p.page}>{p.page}</span>
                                <div className="text-right whitespace-nowrap">
                                    <div className="text-sm font-bold text-slate-900">{p.clicks} clicks</div>
                                    <div className="text-xs text-slate-500">{p.impressions} imp</div>
                                </div>
                            </div>
                        ))}
                        {data.top_pages.length === 0 && <div className="p-6 text-center text-slate-500">No page data available.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
