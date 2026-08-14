import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Users, DollarSign, BarChart3, Filter, Download, RefreshCw, FlaskConical, ExternalLink } from 'lucide-react';
import api, { reports } from '../services/api';
import { downloadFile } from '../utils/downloadFile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

const REPORT_TYPE_LABELS = {
    FULL_KUNDLI: 'Full Kundli',
    GUN_MILAN: 'Gun Milan',
    CAREER_FINANCE: 'Career & Finance',
};

export default function AdminReportAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await reports.analyticsDashboard();
                setAnalytics(res.data);
            } catch (err) {
                setError(err.message || 'Analytics endpoint error');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-900">Loading Ad-Hoc Report Telemetry...</div>;
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                Error loading analytics: {error}
            </div>
        );
    }

    return (
        <div className="p-0 max-w-[1600px] mx-auto space-y-8">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-gray-900 flex items-center gap-2">
                        <BarChart3 className="text-amber-600" size={28} /> Ad-Hoc Report & Lead Telemetry
                    </h1>
                    <p className="text-gray-900 mt-1">
                        Tracks captured leads, direct report sales revenue, and marketing funnel conversion rates.
                    </p>
                </div>
                <GenerateTestReportButton />
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Leads Captured"
                    value={analytics?.total_leads_captured || 0}
                    icon={<Users className="text-blue-600" size={24} />}
                    color="bg-blue-50"
                    footnote="From aadikarta.org lead form"
                />
                <StatCard
                    title="Total Direct Report Sales"
                    value={analytics?.total_paid_reports || 0}
                    icon={<Sparkles className="text-amber-600" size={24} />}
                    color="bg-amber-50"
                    footnote="Direct gateway payments"
                />
                <StatCard
                    title="Total Report Revenue"
                    value={`₹${analytics?.total_revenue_inr?.toLocaleString() || 0}`}
                    icon={<DollarSign className="text-emerald-600" size={24} />}
                    color="bg-emerald-50"
                    footnote="~97% gross profit margin"
                />
                <StatCard
                    title="Funnel Conversion Rate"
                    value={`${analytics?.conversion_rate || 0}%`}
                    icon={<TrendingUp className="text-purple-600" size={24} />}
                    color="bg-purple-50"
                    footnote="Lead to Paid Order ratio"
                />
            </div>

            {/* Detail Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Leads by Segment */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-amber-600" /> Marketing Leads by Segment
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(analytics?.leads_by_segment || {}).map(([seg, count]) => (
                            <div key={seg} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg text-xs">
                                <span className="capitalize text-gray-700 font-mono">{seg || 'general'}</span>
                                <span className="font-bold text-amber-600">{count} leads</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue by Report Type */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" /> Revenue Breakdown by Report Product
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(analytics?.revenue_by_type || {}).map(([rtype, rev]) => (
                            <div key={rtype} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg text-xs">
                                <span className="capitalize text-gray-700 font-mono">{rtype}</span>
                                <span className="font-bold text-emerald-600">₹{rev.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <LeadsTable />
        </div>
    );
}

const EMPTY_TEST_FORM = {
    report_type: 'FULL_KUNDLI',
    language: 'en',
    full_name: '',
    phone_number: '',
    email: '',
    gender: 'MALE',
    date_of_birth: '',
    time_of_birth: '12:00',
    place_of_birth: '',
    partner_full_name: '',
    partner_date_of_birth: '',
    partner_time_of_birth: '12:00',
    partner_place_of_birth: '',
};

function GenerateTestReportButton() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_TEST_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const close = () => {
        setOpen(false);
        setForm(EMPTY_TEST_FORM);
        setError(null);
        setResult(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const payload = { ...form };
            if (form.report_type !== 'GUN_MILAN') {
                delete payload.partner_full_name;
                delete payload.partner_date_of_birth;
                delete payload.partner_time_of_birth;
                delete payload.partner_place_of_birth;
            }
            const res = await reports.generateInternalTest(payload);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Failed to generate test report');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Button variant="outlined" onClick={() => setOpen(true)}>
                <FlaskConical size={16} className="mr-2" /> Generate Test Report
            </Button>

            <Modal isOpen={open} onClose={close} title="Generate Test Report (No Payment)" className="max-w-xl">
                {!result ? (
                    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                        <p className="text-xs text-gray-500">
                            Runs the real AI report generation end-to-end for free (marked as an internal test, excluded
                            from revenue). The WhatsApp report link is sent to the mobile number below — use your own
                            test number, not a real customer's.
                        </p>

                        {error && <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">{error}</div>}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Report Type</label>
                                <select
                                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                                    value={form.report_type}
                                    onChange={set('report_type')}
                                >
                                    <option value="FULL_KUNDLI">Full Kundli</option>
                                    <option value="GUN_MILAN">Gun Milan</option>
                                    <option value="CAREER_FINANCE">Career & Finance</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                                <select
                                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                                    value={form.language}
                                    onChange={set('language')}
                                >
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Full Name" required value={form.full_name} onChange={set('full_name')} />
                            <Input label="Mobile / WhatsApp (test number)" required value={form.phone_number} onChange={set('phone_number')} />
                            <Input label="Email (optional)" type="email" value={form.email} onChange={set('email')} />
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                                    value={form.gender}
                                    onChange={set('gender')}
                                >
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <Input label="Date of Birth" type="date" required value={form.date_of_birth} onChange={set('date_of_birth')} />
                            <Input label="Time of Birth" type="time" required value={form.time_of_birth} onChange={set('time_of_birth')} />
                            <div className="col-span-2">
                                <Input label="Place of Birth" required value={form.place_of_birth} onChange={set('place_of_birth')} />
                            </div>
                        </div>

                        {form.report_type === 'GUN_MILAN' && (
                            <div className="pt-2 space-y-3 border-t">
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 pt-2">Partner's Birth Details</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Partner's Full Name" required value={form.partner_full_name} onChange={set('partner_full_name')} />
                                    <Input label="Partner's Date of Birth" type="date" required value={form.partner_date_of_birth} onChange={set('partner_date_of_birth')} />
                                    <Input label="Partner's Time of Birth" type="time" required value={form.partner_time_of_birth} onChange={set('partner_time_of_birth')} />
                                    <Input label="Partner's Place of Birth" required value={form.partner_place_of_birth} onChange={set('partner_place_of_birth')} />
                                </div>
                            </div>
                        )}

                        <Button type="submit" disabled={submitting} className="w-full">
                            {submitting ? 'Generating Report...' : 'Generate Report'}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-4 text-sm">
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
                            Report generated successfully. {result.whatsapp_sent ? 'WhatsApp link dispatched.' : 'WhatsApp dispatch failed — check the number and WhatsApp integration status.'}
                        </div>
                        <div><span className="font-medium">Order Reference:</span> <span className="font-mono text-xs">{result.order_reference}</span></div>
                        <a
                            href={`${api.defaults.baseURL.replace(/\/$/, '')}/reports/${result.order_reference}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline text-sm font-medium"
                        >
                            View / Download PDF <ExternalLink size={14} />
                        </a>
                        <div className="pt-2">
                            <Button variant="outlined" onClick={close}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

function LeadsTable() {
    const [leads, setLeads] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [search, setSearch] = useState('');
    const [reportType, setReportType] = useState('');
    const [convertedOnly, setConvertedOnly] = useState(false);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = { skip: page * rowsPerPage, limit: rowsPerPage };
            if (search) params.search = search;
            if (reportType) params.report_type = reportType;
            if (convertedOnly) params.converted_only = true;

            const res = await reports.listLeads(params);
            setLeads(res.data.leads);
            setTotal(res.data.total);
        } catch (err) {
            console.error('Failed to fetch report leads', err);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, reportType, convertedOnly]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            fetchLeads();
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, reportType, convertedOnly]);

    const handleExport = async () => {
        setExporting(true);
        const params = {};
        if (search) params.search = search;
        if (reportType) params.report_type = reportType;
        if (convertedOnly) params.converted_only = true;
        await downloadFile('/reports/leads/export', params, 'report-leads.csv');
        setExporting(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl text-gray-900 flex items-center gap-2">
                    <Users className="text-blue-600" size={20} /> Captured Leads
                </h2>
                <Button onClick={handleExport} disabled={exporting}>
                    <Download size={16} className="mr-2" /> {exporting ? 'Preparing CSV...' : 'Download CSV'}
                </Button>
            </div>

            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Input
                            label="Search name / mobile / email"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="e.g. Vikram or 98765..."
                        />
                    </div>
                    <div className="w-full sm:w-56">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                        <select
                            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="FULL_KUNDLI">Full Kundli</option>
                            <option value="GUN_MILAN">Gun Milan</option>
                            <option value="CAREER_FINANCE">Career & Finance</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 h-9 shrink-0">
                        <input
                            type="checkbox"
                            checked={convertedOnly}
                            onChange={(e) => setConvertedOnly(e.target.checked)}
                        />
                        Converted (paid) only
                    </label>
                    <Button variant="outlined" onClick={fetchLeads}>
                        <RefreshCw size={16} className="mr-2" /> Refresh
                    </Button>
                </div>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Captured At</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Report Type</TableHead>
                            <TableHead>Segment</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.map((lead) => (
                            <TableRow
                                key={lead.lead_id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => setSelectedLead(lead)}
                            >
                                <TableCell className="whitespace-nowrap">
                                    {new Date(lead.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>{lead.full_name}</TableCell>
                                <TableCell className="font-mono text-xs">{lead.phone_number}</TableCell>
                                <TableCell className="text-xs">{lead.email || '-'}</TableCell>
                                <TableCell>{REPORT_TYPE_LABELS[lead.report_type] || lead.report_type || '-'}</TableCell>
                                <TableCell className="capitalize">{lead.marketing_segment || 'general'}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${lead.converted ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                                        {lead.converted ? 'Converted' : 'Lead Only'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && leads.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-900">
                                    No leads found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-900">
                        Showing {total === 0 ? 0 : page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, total)} of {total} entries
                    </div>
                    <div className="flex items-center space-x-2">
                        <select
                            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(0);
                            }}
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                        <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={(page + 1) * rowsPerPage >= total}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
        </div>
    );
}

function LeadDetailModal({ lead, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!lead) {
            setDetail(null);
            return;
        }
        setLoading(true);
        reports.getLead(lead.lead_id)
            .then((res) => setDetail(res.data))
            .catch((err) => console.error('Failed to fetch lead detail', err))
            .finally(() => setLoading(false));
    }, [lead]);

    return (
        <Modal isOpen={!!lead} onClose={onClose} title="Lead Detail" className="max-w-2xl">
            {loading && <div className="text-sm text-gray-500">Loading...</div>}
            {!loading && detail && (
                <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div><span className="font-medium">Full Name:</span> {detail.full_name}</div>
                        <div><span className="font-medium">Mobile:</span> {detail.phone_number}</div>
                        <div><span className="font-medium">Email:</span> {detail.email || '-'}</div>
                        <div><span className="font-medium">Gender:</span> {detail.gender || '-'}</div>
                        <div><span className="font-medium">Date of Birth:</span> {detail.date_of_birth}</div>
                        <div><span className="font-medium">Time of Birth:</span> {detail.time_of_birth}</div>
                        <div className="col-span-2"><span className="font-medium">Place of Birth:</span> {detail.place_of_birth}</div>
                        <div><span className="font-medium">Report Type:</span> {REPORT_TYPE_LABELS[detail.report_type] || detail.report_type || '-'}</div>
                        <div><span className="font-medium">Segment:</span> {detail.marketing_segment || 'general'}</div>
                        <div><span className="font-medium">Campaign Source:</span> {detail.campaign_source || '-'}</div>
                        <div><span className="font-medium">Captured At:</span> {new Date(detail.created_at).toLocaleString()}</div>
                    </div>

                    {detail.partner_full_name && (
                        <div className="border-t pt-3">
                            <div className="font-medium mb-1">Partner (Gun Milan)</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><span className="font-medium">Name:</span> {detail.partner_full_name}</div>
                                <div><span className="font-medium">DOB:</span> {detail.partner_date_of_birth}</div>
                                <div><span className="font-medium">TOB:</span> {detail.partner_time_of_birth}</div>
                                <div><span className="font-medium">Place:</span> {detail.partner_place_of_birth}</div>
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-3">
                        <div className="font-medium mb-2">Orders ({detail.orders.length})</div>
                        {detail.orders.length === 0 && <div className="text-gray-500 text-xs">No orders placed yet.</div>}
                        <div className="space-y-2">
                            {detail.orders.map((o) => (
                                <div key={o.order_reference} className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 text-xs">
                                    <div>
                                        <div className="font-mono">{o.order_reference}</div>
                                        <div className="text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div>₹{o.amount}</div>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${o.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                                            {o.payment_status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

function StatCard({ title, value, icon, color, footnote }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                {footnote && <p className="text-xs text-gray-500 mt-1">{footnote}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
        </div>
    );
}
