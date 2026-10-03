import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TextArea } from '../../components/ui/TextArea';
import { Sparkles, Search, Plus, FileText, EyeOff, RotateCcw, Loader2 } from 'lucide-react';
import { seoAgent } from '../../services/api';
import SeoQualityReport from '../../components/SeoQualityReport';
import clsx from 'clsx';

const STATUSES = ['', 'NEW', 'DRAFTED', 'PUBLISHED', 'FAILED', 'IGNORED'];
const STATUS_STYLES = {
    NEW: 'bg-blue-100 text-blue-800',
    DRAFTED: 'bg-yellow-100 text-yellow-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    IGNORED: 'bg-gray-100 text-gray-600',
};
const SOURCE_LABELS = { ADMIN: 'Admin', AI_SUGGESTION: 'AI idea', GSC: 'Search Console' };

export default function SeoAgent() {
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [keywords, setKeywords] = useState([]);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState('NEW');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [newKeywords, setNewKeywords] = useState('');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState('');          // which action is running
    const [message, setMessage] = useState(null);  // { type: 'info'|'error', text }
    const [lastDraft, setLastDraft] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const [s, k] = await Promise.all([
                seoAgent.status(),
                seoAgent.listKeywords(filter ? { status: filter } : {}),
            ]);
            setStatus(s.data);
            setKeywords(k.data.keywords);
            setTotal(k.data.total);
        } catch (e) {
            setLoadError(e.message || 'Failed to load the SEO Agent queue.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const run = async (key, fn) => {
        setBusy(key);
        setMessage(null);
        try {
            await fn();
        } catch (e) {
            setMessage({ type: 'error', text: e.message || 'Something went wrong.' });
        } finally {
            setBusy('');
            load();
        }
    };

    const handleAdd = () => run('add', async () => {
        const list = newKeywords.split('\n').map(s => s.trim()).filter(Boolean);
        if (list.length === 0) {
            setMessage({ type: 'error', text: 'Enter at least one keyword (one per line).' });
            return;
        }
        const res = await seoAgent.addKeywords(list, notes.trim() || null);
        setNewKeywords('');
        setNotes('');
        const skipped = res.data.skipped.length ? ` Already queued: ${res.data.skipped.join(', ')}.` : '';
        setMessage({ type: 'info', text: `Added ${res.data.created.length} keyword(s).${skipped}` });
    });

    const handleImport = () => run('import', async () => {
        const res = await seoAgent.importGsc(1);
        const d = res.data;
        setMessage({ type: 'info', text: `Search Console: read ${d.rows_read} rows; ${d.created} new keyword(s), ${d.updated} refreshed.` });
    });

    const handleSuggest = () => run('suggest', async () => {
        const res = await seoAgent.suggest();
        const skipped = res.data.skipped.length ? ` ${res.data.skipped.length} were already queued.` : '';
        setMessage({ type: 'info', text: `Claude suggested ${res.data.created.length} new topic(s).${skipped} These have no search-volume data.` });
    });

    const handleDraft = (kw) => run(`draft-${kw.id}`, async () => {
        const res = await seoAgent.draft(kw.id);
        setLastDraft({ ...res.data, keyword: kw.keyword });
        setMessage({ type: 'info', text: `Draft created for "${kw.keyword}". Review it before publishing.` });
    });

    const handleIgnore = (kw) => run(`ignore-${kw.id}`, () => seoAgent.ignore(kw.id));
    const handleRestore = (kw) => run(`restore-${kw.id}`, () => seoAgent.restore(kw.id));

    const limitReached = status && status.drafted_today >= status.daily_draft_limit;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl text-gray-900">SEO Agent</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Queue target keywords, let Claude draft a blog post for one, then review and publish it from the post editor.
                    Drafts are never published automatically.
                </p>
                {status && (
                    <p className="mt-2 text-sm text-gray-700">
                        Model: <span className="font-mono">{status.model}</span> ·
                        Drafts today: <strong>{status.drafted_today} / {status.daily_draft_limit}</strong>
                        {!status.anthropic_configured && <span className="ml-2 text-red-700">ANTHROPIC_API_KEY is not set: drafting and suggestions are unavailable.</span>}
                    </p>
                )}
            </div>

            {message && (
                <div className={clsx('rounded-lg border p-3 text-sm', message.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-900')}>
                    {message.text}
                </div>
            )}

            {lastDraft && (
                <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-gray-800">
                            Latest draft for <strong>{lastDraft.keyword}</strong> ({lastDraft.usage?.input_tokens} input / {lastDraft.usage?.output_tokens} output tokens)
                        </p>
                        <Button size="sm" onClick={() => navigate(`/cms/posts/edit/${lastDraft.post_id}`)}>
                            <FileText size={14} className="mr-1" /> Review draft
                        </Button>
                    </div>
                    <SeoQualityReport report={lastDraft.quality} />
                </Card>
            )}

            <Card className="p-4 space-y-3">
                <h2 className="text-lg font-medium text-gray-900">Add topics</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    <TextArea
                        rows={4}
                        placeholder={'One keyword per line, e.g.\nmanglik dosha in 7th house\nwhat is nadi dosha in kundli matching'}
                        value={newKeywords}
                        onChange={(e) => setNewKeywords(e.target.value)}
                    />
                    <TextArea
                        rows={4}
                        placeholder="Optional notes for the writer (angle, audience, what to cover). Applied to every keyword above."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleAdd} disabled={!!busy}>
                        {busy === 'add' ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Plus size={16} className="mr-2" />} Add keywords
                    </Button>
                    <Button variant="outlined" onClick={handleImport} disabled={!!busy}>
                        {busy === 'import' ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Search size={16} className="mr-2" />} Import from Search Console
                    </Button>
                    <Button variant="outlined" onClick={handleSuggest} disabled={!!busy || (status && !status.anthropic_configured)}>
                        {busy === 'suggest' ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />} Suggest topics (AI)
                    </Button>
                </div>
                <p className="text-xs text-gray-500">
                    AI suggestions have no search-volume data. Search Console imports show the impressions and position the site already gets for that query.
                </p>
            </Card>

            <Card>
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <h2 className="text-lg font-medium text-gray-900">Queue <span className="text-sm font-normal text-gray-500">({total})</span></h2>
                    <select
                        className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
                    </select>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Keyword</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Search Console</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow><TableCell colSpan={5} className="py-8 text-center text-gray-500">Loading…</TableCell></TableRow>
                        )}
                        {!loading && loadError && (
                            <TableRow><TableCell colSpan={5} className="py-8 text-center text-red-700">{loadError}</TableCell></TableRow>
                        )}
                        {!loading && !loadError && keywords.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="py-8 text-center text-gray-500">No keywords{filter ? ` with status ${filter}` : ''}.</TableCell></TableRow>
                        )}
                        {!loading && !loadError && keywords.map(kw => (
                            <TableRow key={kw.id}>
                                <TableCell className="max-w-md">
                                    <div className="font-medium text-gray-900">{kw.keyword}</div>
                                    {kw.notes && <div className="mt-0.5 text-xs text-gray-500">{kw.notes}</div>}
                                    {kw.status === 'FAILED' && kw.last_error && <div className="mt-0.5 text-xs text-red-700">{kw.last_error}</div>}
                                    {kw.post_id && (
                                        <button type="button" className="mt-0.5 text-xs text-indigo-600 hover:underline" onClick={() => navigate(`/cms/posts/edit/${kw.post_id}`)}>
                                            {kw.post_title} ({kw.post_status})
                                        </button>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">{SOURCE_LABELS[kw.source] || kw.source}</TableCell>
                                <TableCell className="text-sm text-gray-700">
                                    {kw.gsc_impressions != null
                                        ? <>{kw.gsc_impressions} impr · pos {Number(kw.gsc_position).toFixed(1)}</>
                                        : <span className="text-gray-400">no data</span>}
                                </TableCell>
                                <TableCell>
                                    <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLES[kw.status])}>{kw.status}</span>
                                </TableCell>
                                <TableCell className="space-x-2 whitespace-nowrap text-right">
                                    {(kw.status === 'NEW' || kw.status === 'FAILED') && (
                                        <>
                                            <Button size="sm" onClick={() => handleDraft(kw)}
                                                disabled={!!busy || limitReached || (status && !status.anthropic_configured)}
                                                title={limitReached ? 'Daily draft limit reached' : 'Ask Claude to draft a post (takes about a minute)'}>
                                                {busy === `draft-${kw.id}` ? <><Loader2 size={14} className="mr-1 animate-spin" /> Drafting…</> : 'Draft post'}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleIgnore(kw)} disabled={!!busy} title="Ignore">
                                                <EyeOff size={14} />
                                            </Button>
                                        </>
                                    )}
                                    {kw.status === 'IGNORED' && (
                                        <Button size="sm" variant="ghost" onClick={() => handleRestore(kw)} disabled={!!busy} title="Restore">
                                            <RotateCcw size={14} />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
