import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TextArea } from '../../components/ui/TextArea';
import { Input } from '../../components/ui/Input';
import { Facebook, Instagram, Youtube, Download, X, Trash2, Upload, Twitter, Linkedin, Copy, Check } from 'lucide-react';
import { contentStudio } from '../../services/api';
import clsx from 'clsx';

const toAbsoluteUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const PLATFORMS = [
    { key: 'facebook', label: 'Facebook', icon: Facebook, postedField: 'posted_facebook_at', keywordsField: 'seo_keywords_facebook', action: 'postFacebook', needsCaption: true },
    { key: 'instagram', label: 'Instagram', icon: Instagram, postedField: 'posted_instagram_at', keywordsField: 'seo_keywords_instagram', action: 'postInstagram', needsCaption: true },
    { key: 'youtube', label: 'YouTube', icon: Youtube, postedField: 'posted_youtube_at', keywordsField: 'seo_keywords_youtube', action: 'postYoutube', needsCaption: true },
];

// X.com and LinkedIn have no publish API configured here -- these are
// copy-paste-only: AI Generate produces post content + tags as two
// separately copyable fields for manual posting, no "sent" status tracked.
const SOCIAL_COPY_PLATFORMS = [
    { key: 'twitter', label: 'X.com', icon: Twitter },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
];

function NewVideoModal({ onClose, onCreated }) {
    const [topic, setTopic] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [file, setFile] = useState(null);
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!topic.trim()) {
            alert('Topic is required.');
            return;
        }
        if (!file) {
            alert('Please choose a video file to upload.');
            return;
        }
        setCreating(true);
        try {
            const formData = new FormData();
            formData.append('topic', topic.trim());
            if (shortDescription.trim()) formData.append('short_description', shortDescription.trim());
            formData.append('file', file);
            const res = await contentStudio.createJobWithVideo(formData);
            onCreated(res.data);
        } catch (e) {
            alert(e.message || 'Failed to create video.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">New Video</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <TextArea
                    fullWidth
                    label="Topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={creating}
                    className="h-24"
                />
                <TextArea
                    fullWidth
                    label="Short Description"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    disabled={creating}
                    className="h-20"
                />
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Video file (MP4)</label>
                    <input
                        type="file"
                        accept="video/mp4"
                        disabled={creating}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer"
                    />
                    {file && <p className="mt-1 text-xs text-slate-500 truncate">{file.name}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outlined" size="sm" onClick={onClose} disabled={creating} className="cursor-pointer">Cancel</Button>
                    <Button size="sm" onClick={handleCreate} disabled={creating} className="cursor-pointer">
                        {creating ? 'Creating...' : 'Create'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function CaptionModal({ job, platform, editMode, onClose, onPosted, onSynced }) {
    const isYoutube = platform.key === 'youtube';
    const [title, setTitle] = useState(editMode ? (job.youtube_title || '') : '');
    const [caption, setCaption] = useState(editMode ? (job.youtube_description || '') : '');
    const [seoKeywords, setSeoKeywords] = useState(job[platform.keywordsField] || '');
    // In edit mode the fields start out prefilled from our last-known copy,
    // then get overwritten by whatever is actually live on YouTube once the
    // sync below resolves -- our copy drifts if the video was ever edited
    // directly in YouTube Studio instead of through this admin.
    const [generating, setGenerating] = useState(!editMode);
    const [syncing, setSyncing] = useState(editMode);
    const [syncFailed, setSyncFailed] = useState(false);
    const [keywordsGenerating, setKeywordsGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    // Mirrors title/caption without going in generate()'s dependency array --
    // generate() must keep a stable identity so the mount-only useEffect below
    // doesn't refire on every keystroke, but "Regenerate with AI" still needs
    // to read whatever is currently in the fields at click time.
    const draftRef = useRef({ title, caption });
    draftRef.current = { title, caption };

    const generate = useCallback(async () => {
        setGenerating(true);
        try {
            if (isYoutube) {
                // Passing the current draft lets the model refine what's already
                // there (hand-edited or already published) instead of guessing a
                // fresh, unrelated title/description from just the topic every
                // time "Regenerate with AI" is clicked.
                const { title: currentTitle, caption: currentCaption } = draftRef.current;
                const res = await contentStudio.generateYoutubeCopy(job.id, currentTitle, currentCaption);
                setTitle(res.data.title || '');
                setCaption(res.data.description || '');
            } else {
                const res = await contentStudio.generateCaption(job.id);
                setCaption(res.data.caption || '');
            }
        } catch (e) {
            alert(e.message || 'Failed to generate caption.');
        } finally {
            setGenerating(false);
        }
    }, [job.id, isYoutube]);

    const generateKeywords = useCallback(async () => {
        setKeywordsGenerating(true);
        try {
            const res = await contentStudio.generateYoutubeTags(job.id);
            setSeoKeywords(res.data.tags || '');
        } catch (e) {
            alert(e.message || 'Failed to generate YouTube tags.');
        } finally {
            setKeywordsGenerating(false);
        }
    }, [job.id]);

    const syncFromYoutube = useCallback(async () => {
        setSyncing(true);
        setSyncFailed(false);
        try {
            const res = await contentStudio.getLiveYoutubeVideo(job.id);
            setTitle(res.data.youtube_title || '');
            setCaption(res.data.youtube_description || '');
            setSeoKeywords(res.data.seo_keywords_youtube || '');
            onSynced?.(res.data);
        } catch (e) {
            // Keep the last-known (possibly stale) values already in the
            // fields rather than blocking the edit -- surface the failure so
            // the admin knows they may be looking at a stale copy.
            setSyncFailed(true);
            console.error('Failed to sync YouTube video metadata', e);
        } finally {
            setSyncing(false);
        }
    }, [job.id, onSynced]);

    useEffect(() => {
        if (editMode) {
            syncFromYoutube();
        } else {
            generate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode]);

    const handlePost = async () => {
        if (!caption.trim()) {
            alert('Caption cannot be empty.');
            return;
        }
        if (isYoutube && !title.trim()) {
            alert('Title cannot be empty.');
            return;
        }
        setSending(true);
        try {
            const res = editMode
                ? await contentStudio.updateYoutubeVideo(job.id, title.trim(), caption.trim(), seoKeywords.trim())
                : await contentStudio[platform.action](job.id, caption.trim(), seoKeywords.trim(), isYoutube ? title.trim() : undefined);
            onPosted(res.data);
        } catch (e) {
            alert(e.message || `Failed to ${editMode ? 'update' : 'post to'} ${platform.label}.`);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <platform.icon size={18} /> {editMode ? `Edit ${platform.label} Video` : `Post to ${platform.label}`}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-xs text-slate-500 truncate" title={job.topic}>{job.topic}</p>
                {syncing && (
                    <p className="text-xs text-slate-500">Syncing current title/description from YouTube...</p>
                )}
                {syncFailed && (
                    <p className="text-xs text-amber-600">
                        Couldn't fetch the latest metadata from YouTube -- showing our last-known copy, which may be
                        out of date if this video was edited directly in YouTube Studio.{' '}
                        <button type="button" onClick={syncFromYoutube} className="underline font-semibold cursor-pointer">
                            Retry
                        </button>
                    </p>
                )}
                {isYoutube && (
                    <div className="space-y-1">
                        <Input
                            fullWidth
                            label="Title"
                            value={generating ? 'Generating title...' : (syncing ? 'Syncing...' : title)}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={generating || syncing}
                            maxLength={100}
                        />
                        {!generating && !syncing && (
                            <p className={clsx('text-[11px] text-right', title.length > 100 ? 'text-red-500' : 'text-slate-400')}>
                                {title.length}/100
                            </p>
                        )}
                    </div>
                )}
                <TextArea
                    fullWidth
                    label={isYoutube ? 'Description' : 'Caption'}
                    value={generating ? (isYoutube ? 'Generating description...' : 'Generating caption...') : (syncing ? 'Syncing...' : caption)}
                    onChange={(e) => setCaption(e.target.value)}
                    disabled={generating || syncing}
                    className="h-40"
                />
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-700">SEO Keywords ({platform.label})</label>
                        {platform.key === 'youtube' && (
                            <button
                                type="button"
                                onClick={generateKeywords}
                                disabled={keywordsGenerating || generating || syncing}
                                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 cursor-pointer"
                            >
                                {keywordsGenerating ? 'Generating...' : 'Generate with AI'}
                            </button>
                        )}
                    </div>
                    <TextArea
                        fullWidth
                        placeholder={platform.key === 'youtube' ? 'Comma-separated tags, e.g. astrology, horoscope, zodiac' : 'Comma-separated keywords for discovery'}
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        disabled={generating || keywordsGenerating || syncing}
                        className="h-20"
                    />
                </div>
                <div className="flex items-center justify-between pt-2">
                    <Button variant="outlined" size="sm" onClick={generate} disabled={generating || syncing} className="cursor-pointer">
                        {generating ? 'Generating...' : 'Regenerate with AI'}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outlined" size="sm" onClick={onClose} disabled={sending} className="cursor-pointer">Cancel</Button>
                        <Button size="sm" onClick={handlePost} disabled={generating || syncing || keywordsGenerating || sending} className="cursor-pointer">
                            {sending ? (editMode ? 'Saving...' : 'Posting...') : (editMode ? 'Save Changes' : `Post to ${platform.label}`)}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SocialCopyModal({ job, platform, onClose }) {
    const [text, setText] = useState('');
    const [tags, setTags] = useState('');
    const [generating, setGenerating] = useState(true);
    const [copiedField, setCopiedField] = useState('');

    const generate = useCallback(async () => {
        setGenerating(true);
        try {
            const res = await contentStudio.generateSocialCopy(job.id, platform.key);
            setText(res.data.text || '');
            setTags(res.data.tags || '');
        } catch (e) {
            alert(e.message || `Failed to generate ${platform.label} content.`);
        } finally {
            setGenerating(false);
        }
    }, [job.id, platform.key, platform.label]);

    useEffect(() => { generate(); }, [generate]);

    const handleCopy = async (field, value) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(field);
            setTimeout(() => setCopiedField(''), 1500);
        } catch {
            alert('Failed to copy to clipboard.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <platform.icon size={18} /> {platform.label} Content
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-xs text-slate-500 truncate" title={job.topic}>{job.topic}</p>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-700">Post Content</label>
                        <button
                            type="button"
                            onClick={() => handleCopy('text', text)}
                            disabled={!text || generating}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                        >
                            {copiedField === 'text' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                        </button>
                    </div>
                    <TextArea
                        fullWidth
                        value={generating ? 'Generating...' : text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={generating}
                        className="h-32"
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-700">Tags</label>
                        <button
                            type="button"
                            onClick={() => handleCopy('tags', tags)}
                            disabled={!tags || generating}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                        >
                            {copiedField === 'tags' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                        </button>
                    </div>
                    <TextArea
                        fullWidth
                        value={generating ? '' : tags}
                        onChange={(e) => setTags(e.target.value)}
                        disabled={generating}
                        className="h-20"
                    />
                </div>

                <div className="flex items-center justify-between pt-2">
                    <Button variant="outlined" size="sm" onClick={generate} disabled={generating} className="cursor-pointer">
                        {generating ? 'Generating...' : 'Regenerate with AI'}
                    </Button>
                    <Button variant="outlined" size="sm" onClick={onClose} className="cursor-pointer">Close</Button>
                </div>
            </div>
        </div>
    );
}

function JobDetailModal({ job, onClose, onSaved }) {
    const [shortDescription, setShortDescription] = useState(job.short_description || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await contentStudio.updateJob(job.id, { short_description: shortDescription.trim() || null });
            onSaved(res.data);
        } catch (e) {
            alert(e.message || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Video Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Topic</label>
                    <p className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2">{job.topic}</p>
                </div>
                <TextArea
                    fullWidth
                    label="Short Description"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    disabled={saving}
                    className="h-32"
                />
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outlined" size="sm" onClick={onClose} disabled={saving} className="cursor-pointer">Close</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer">
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
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
    const [socialCopyModal, setSocialCopyModal] = useState(null); // { job, platform } | null
    const [detailModal, setDetailModal] = useState(null); // job | null
    const [showNewVideoModal, setShowNewVideoModal] = useState(false);
    const [deleting, setDeleting] = useState({}); // jobId -> true while delete is in flight
    const [uploading, setUploading] = useState({}); // jobId -> true while a video upload is in flight
    const limit = 20;
    const fileInputRef = useRef(null);
    const uploadTargetJobId = useRef(null);

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

    const handleEditYoutube = (job) => {
        setCaptionModal({ job, platform: PLATFORMS.find(p => p.key === 'youtube'), editMode: true });
    };

    const handlePosted = (updatedJob) => {
        setJobs(prev => prev.map(j => (j.id === updatedJob.id ? updatedJob : j)));
        setCaptionModal(null);
    };

    // Keeps the row list's cached youtube_title/youtube_description in step
    // with what the edit modal just pulled live from YouTube, without
    // closing the modal (unlike handlePosted, which is only for a completed
    // post/save).
    const handleSynced = (updatedJob) => {
        setJobs(prev => prev.map(j => (j.id === updatedJob.id ? updatedJob : j)));
    };

    const handleVideoCreated = (job) => {
        setJobs(prev => [job, ...prev]);
        setTotal(prev => prev + 1);
        setShowNewVideoModal(false);
    };

    const handleUploadClick = (job) => {
        uploadTargetJobId.current = job.id;
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e) => {
        const file = e.target.files?.[0];
        const jobId = uploadTargetJobId.current;
        e.target.value = ''; // allow re-selecting the same file later
        if (!file || !jobId) return;

        setUploading(prev => ({ ...prev, [jobId]: true }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await contentStudio.uploadVideo(jobId, formData);
            setJobs(prev => prev.map(j => (j.id === jobId ? res.data : j)));
        } catch (err) {
            alert(err.message || 'Failed to upload video.');
        } finally {
            setUploading(prev => ({ ...prev, [jobId]: false }));
        }
    };

    const handleDelete = async (job) => {
        if (!window.confirm(`Delete "${job.topic}"? This permanently removes the video and all generated scene files.`)) return;
        setDeleting(prev => ({ ...prev, [job.id]: true }));
        try {
            await contentStudio.deleteJob(job.id);
            setJobs(prev => prev.filter(j => j.id !== job.id));
            setTotal(prev => prev - 1);
        } catch (e) {
            alert(e.message || 'Failed to delete video.');
        } finally {
            setDeleting(prev => ({ ...prev, [job.id]: false }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl text-gray-900">Content Studio Library</h1>
                    <p className="text-sm text-gray-500 mt-1">All generated videos / voice-over content, with posting status for each platform.</p>
                </div>
                <Button onClick={() => setShowNewVideoModal(true)}>New Video</Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Topic</TableHead>
                            <TableHead>Date</TableHead>
                            {PLATFORMS.map(p => <TableHead key={p.key}>{p.label}</TableHead>)}
                            {SOCIAL_COPY_PLATFORMS.map(p => <TableHead key={p.key}>{p.label}</TableHead>)}
                            <TableHead className="text-right">Upload</TableHead>
                            <TableHead className="text-right">Video</TableHead>
                            <TableHead className="text-right">Delete</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id} onClick={() => setDetailModal(job)} className="cursor-pointer">
                                <TableCell className="font-medium max-w-xs truncate" title={job.topic}>{job.topic}</TableCell>
                                <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                                {PLATFORMS.map((platform) => {
                                    const postedAt = job[platform.postedField];
                                    const flightKey = `${job.id}-${platform.key}`;
                                    const isPosting = !!posting[flightKey];
                                    return (
                                        <TableCell key={platform.key} onClick={(e) => e.stopPropagation()}>
                                            {postedAt ? (
                                                platform.key === 'youtube' && job.youtube_video_id ? (
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={`https://youtube.com/watch?v=${job.youtube_video_id}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
                                                            title={new Date(postedAt).toLocaleString()}
                                                        >
                                                            <platform.icon size={14} /> Sent {new Date(postedAt).toLocaleDateString()}
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditYoutube(job)}
                                                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700" title={new Date(postedAt).toLocaleString()}>
                                                        <platform.icon size={14} /> Sent {new Date(postedAt).toLocaleDateString()}
                                                    </span>
                                                )
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
                                {SOCIAL_COPY_PLATFORMS.map((platform) => (
                                    <TableCell key={platform.key} onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="outlined"
                                            size="sm"
                                            onClick={() => setSocialCopyModal({ job, platform })}
                                            className="cursor-pointer"
                                        >
                                            Generate & Copy
                                        </Button>
                                    </TableCell>
                                ))}
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Upload a video rendered elsewhere (e.g. locally) as this job's output"
                                        disabled={job.status === 'RENDERING' || !!uploading[job.id]}
                                        onClick={() => handleUploadClick(job)}
                                        className="cursor-pointer"
                                    >
                                        <Upload size={18} className={clsx("text-gray-600", uploading[job.id] && "animate-pulse")} />
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    {job.output_video_url && (
                                        <a href={toAbsoluteUrl(job.output_video_url)} download target="_blank" rel="noreferrer">
                                            <Button variant="ghost" size="icon"><Download size={18} className="text-gray-600" /></Button>
                                        </a>
                                    )}
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Delete this video and its generated files"
                                        disabled={job.status === 'RENDERING' || !!deleting[job.id]}
                                        onClick={() => handleDelete(job)}
                                        className="cursor-pointer"
                                    >
                                        <Trash2 size={18} className="text-red-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {jobs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2 + PLATFORMS.length + SOCIAL_COPY_PLATFORMS.length + 3} className="text-center py-8 text-gray-900">
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

            <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4"
                className="hidden"
                onChange={handleFileSelected}
            />

            {captionModal && (
                <CaptionModal
                    job={captionModal.job}
                    platform={captionModal.platform}
                    editMode={captionModal.editMode}
                    onClose={() => setCaptionModal(null)}
                    onPosted={handlePosted}
                    onSynced={handleSynced}
                />
            )}

            {socialCopyModal && (
                <SocialCopyModal
                    job={socialCopyModal.job}
                    platform={socialCopyModal.platform}
                    onClose={() => setSocialCopyModal(null)}
                />
            )}

            {detailModal && (
                <JobDetailModal
                    job={detailModal}
                    onClose={() => setDetailModal(null)}
                    onSaved={(updatedJob) => {
                        setJobs(prev => prev.map(j => (j.id === updatedJob.id ? updatedJob : j)));
                        setDetailModal(null);
                    }}
                />
            )}

            {showNewVideoModal && (
                <NewVideoModal
                    onClose={() => setShowNewVideoModal(false)}
                    onCreated={handleVideoCreated}
                />
            )}
        </div>
    );
}
