import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TextArea } from '../../components/ui/TextArea';
import { Facebook, Instagram, Youtube, Download, X } from 'lucide-react';
import { contentStudio } from '../../services/api';
import clsx from 'clsx';

const toAbsoluteUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const PLATFORMS = [
    { key: 'facebook', label: 'Facebook', icon: Facebook, postedField: 'posted_facebook_at', action: 'postFacebook', needsCaption: true },
    { key: 'instagram', label: 'Instagram', icon: Instagram, postedField: 'posted_instagram_at', action: 'postInstagram', needsCaption: true },
    { key: 'youtube', label: 'YouTube', icon: Youtube, postedField: 'posted_youtube_at', action: 'postYoutube', needsCaption: true },
];

function CaptionModal({ job, platform, onClose, onPosted }) {
    const [caption, setCaption] = useState('');
    const [generating, setGenerating] = useState(true);
    const [sending, setSending] = useState(false);

    const generate = useCallback(async () => {
        setGenerating(true);
        try {
            const res = await contentStudio.generateCaption(job.id);
            setCaption(res.data.caption || '');
        } catch (e) {
            alert(e.message || 'Failed to generate caption.');
        } finally {
            setGenerating(false);
        }
    }, [job.id]);

    useEffect(() => { generate(); }, [generate]);

    const handlePost = async () => {
        if (!caption.trim()) {
            alert('Caption cannot be empty.');
            return;
        }
        setSending(true);
        try {
            const res = await contentStudio[platform.action](job.id, caption.trim());
            onPosted(res.data);
        } catch (e) {
            alert(e.message || `Failed to post to ${platform.label}.`);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <platform.icon size={18} /> Post to {platform.label}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-xs text-slate-500 truncate" title={job.topic}>{job.topic}</p>
                <TextArea
                    fullWidth
                    label="Caption"
                    value={generating ? 'Generating caption...' : caption}
                    onChange={(e) => setCaption(e.target.value)}
                    disabled={generating}
                    className="h-40"
                />
                <div className="flex items-center justify-between pt-2">
                    <Button variant="outlined" size="sm" onClick={generate} disabled={generating} className="cursor-pointer">
                        {generating ? 'Generating...' : 'Regenerate with AI'}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outlined" size="sm" onClick={onClose} disabled={sending} className="cursor-pointer">Cancel</Button>
                        <Button size="sm" onClick={handlePost} disabled={generating || sending} className="cursor-pointer">
                            {sending ? 'Posting...' : `Post to ${platform.label}`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ContentStudioLibrary() {
    const [jobs, setJobs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [posting, setPosting] = useState({}); // `${jobId}-${platform}` -> true while in flight
    const [captionModal, setCaptionModal] = useState(null); // { job, platform } | null
    const limit = 20;
    const navigate = useNavigate();

    const fetchJobs = useCallback(async () => {
        try {
            const res = await contentStudio.listJobs({ skip: (page - 1) * limit, limit });
            setJobs(res.data.jobs);
            setTotal(res.data.total);
        } catch (e) {
            console.error('Failed to fetch content studio jobs', e);
        }
    }, [page]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const handleSend = async (job, platform) => {
        if (platform.needsCaption) {
            setCaptionModal({ job, platform });
            return;
        }
        // YouTube: no caption, no real API call — just a manual "mark as sent" flag.
        const flightKey = `${job.id}-${platform.key}`;
        if (!window.confirm('Mark this video as already posted to YouTube?')) return;
        setPosting(prev => ({ ...prev, [flightKey]: true }));
        try {
            const res = await contentStudio[platform.action](job.id);
            setJobs(prev => prev.map(j => (j.id === job.id ? res.data : j)));
        } catch (e) {
            alert(e.message || `Failed to update ${platform.label} status.`);
        } finally {
            setPosting(prev => ({ ...prev, [flightKey]: false }));
        }
    };

    const handlePosted = (updatedJob) => {
        setJobs(prev => prev.map(j => (j.id === updatedJob.id ? updatedJob : j)));
        setCaptionModal(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Content Studio Library</h1>
                    <p className="text-sm text-gray-500 mt-1">All generated videos / voice-over content, with posting status for each platform.</p>
                </div>
                <Button onClick={() => navigate('/content-studio')}>New Video</Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Topic</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Voice</TableHead>
                            <TableHead>Status</TableHead>
                            {PLATFORMS.map(p => <TableHead key={p.key}>{p.label}</TableHead>)}
                            <TableHead className="text-right">Video</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell className="font-medium max-w-xs truncate" title={job.topic}>{job.topic}</TableCell>
                                <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <span className={clsx(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                        job.voice_gender === 'MALE' ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                                    )}>
                                        {job.voice_gender === 'MALE' ? 'Male' : 'Female'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={clsx(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                        job.status === 'DONE' ? "bg-green-100 text-green-800" :
                                            job.status === 'FAILED' ? "bg-red-100 text-red-800" :
                                                job.status === 'RENDERING' ? "bg-yellow-100 text-yellow-800" :
                                                    "bg-gray-100 text-gray-800"
                                    )}>
                                        {job.status}
                                    </span>
                                </TableCell>
                                {PLATFORMS.map((platform) => {
                                    const postedAt = job[platform.postedField];
                                    const flightKey = `${job.id}-${platform.key}`;
                                    const isPosting = !!posting[flightKey];
                                    return (
                                        <TableCell key={platform.key}>
                                            {postedAt ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700" title={new Date(postedAt).toLocaleString()}>
                                                    <platform.icon size={14} /> Sent {new Date(postedAt).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <Button
                                                    variant="outlined"
                                                    size="sm"
                                                    disabled={job.status !== 'DONE' || isPosting}
                                                    onClick={() => handleSend(job, platform)}
                                                    className="cursor-pointer"
                                                >
                                                    {isPosting ? 'Sending...' : (platform.sendLabel || 'Send')}
                                                </Button>
                                            )}
                                        </TableCell>
                                    );
                                })}
                                <TableCell className="text-right">
                                    {job.output_video_url && (
                                        <a href={toAbsoluteUrl(job.output_video_url)} download target="_blank" rel="noreferrer">
                                            <Button variant="ghost" size="icon"><Download size={18} className="text-gray-600" /></Button>
                                        </a>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {jobs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4 + PLATFORMS.length + 1} className="text-center py-8 text-gray-900">
                                    No videos generated yet
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {Math.ceil(total / limit) > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <div className="text-sm text-gray-900">
                            Page {page} of {Math.ceil(total / limit)}
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outlined"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outlined"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil(total / limit)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {captionModal && (
                <CaptionModal
                    job={captionModal.job}
                    platform={captionModal.platform}
                    onClose={() => setCaptionModal(null)}
                    onPosted={handlePosted}
                />
            )}
        </div>
    );
}
