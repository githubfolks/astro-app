import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Check, RefreshCw, ChevronDown } from 'lucide-react';
import { socialCopy, contentStudio } from '../../services/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, TextArea } from '../../components/ui';

const PLATFORM_FIELDS = {
    youtube: {
        label: 'YouTube Shorts',
        generate: socialCopy.generateYoutube,
        fields: [
            { key: 'title', label: 'Title', rows: 2 },
            { key: 'description', label: 'Description', rows: 6 },
            { key: 'hashtags', label: 'Hashtags', rows: 2 },
            { key: 'video_tags', label: 'Video Tags', rows: 3 },
            { key: 'pinned_comment', label: 'Pinned Comment', rows: 2 },
        ],
    },
    instagram: {
        label: 'Instagram Reels',
        generate: socialCopy.generateInstagram,
        fields: [
            { key: 'caption', label: 'Caption', rows: 6 },
            { key: 'hashtags', label: 'Hashtags', rows: 2 },
            { key: 'alt_text', label: 'Alt Text', rows: 3 },
            { key: 'cover_text', label: 'Cover Text', rows: 1 },
            { key: 'pinned_comment', label: 'Pinned Comment', rows: 2 },
        ],
    },
    facebook: {
        label: 'Facebook',
        generate: socialCopy.generateFacebook,
        fields: [
            { key: 'text', label: 'Post Content', rows: 5 },
            { key: 'hashtags', label: 'Hashtags', rows: 2 },
        ],
    },
    twitter: {
        label: 'X.com',
        generate: socialCopy.generateTwitter,
        fields: [
            { key: 'text', label: 'Post Content', rows: 4 },
            { key: 'hashtags', label: 'Hashtags', rows: 1 },
        ],
    },
    linkedin: {
        label: 'LinkedIn',
        generate: socialCopy.generateLinkedin,
        fields: [
            { key: 'text', label: 'Post Content', rows: 5 },
            { key: 'hashtags', label: 'Hashtags', rows: 2 },
        ],
    },
};

const PLATFORM_KEYS = Object.keys(PLATFORM_FIELDS);

function TopicDropdown({ value, topics, onSelect, onChangeText }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const containerRef = useRef(null);

    useEffect(() => { setQuery(value); }, [value]);

    useEffect(() => {
        const onClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return topics;
        return topics.filter(t => t.topic.toLowerCase().includes(q));
    }, [topics, query]);

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
            <div className="relative">
                <input
                    type="text"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search or type a topic..."
                    value={query}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChangeText(e.target.value);
                        setOpen(true);
                    }}
                />
                <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {open && filtered.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                    {filtered.map((t) => (
                        <li
                            key={t.id}
                            className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer truncate"
                            title={t.topic}
                            onClick={() => {
                                setQuery(t.topic);
                                setOpen(false);
                                onSelect(t);
                            }}
                        >
                            {t.topic}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function SocialCopyGenerator() {
    const [form, setForm] = useState({
        topic: '',
        description: '',
        keywords: '',
        cta_link: 'aadikarta.org',
        price: '₹10/min',
        language: 'Hindi/English mix',
    });

    const [results, setResults] = useState({});
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState({});
    const [generating, setGenerating] = useState(false);
    const [copiedField, setCopiedField] = useState('');
    const [topics, setTopics] = useState([]);
    const [suggestingKeywords, setSuggestingKeywords] = useState(false);

    useEffect(() => {
        contentStudio.listTopics()
            .then(res => setTopics(res.data.topics || []))
            .catch(e => console.error('Failed to load topics', e));
    }, []);

    const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const suggestKeywords = async (topic, description) => {
        if (!topic.trim()) return;
        setSuggestingKeywords(true);
        try {
            const res = await socialCopy.suggestKeywords({ topic, description });
            setForm(prev => ({ ...prev, keywords: res.data.keywords || prev.keywords }));
        } catch (e) {
            console.error('Failed to suggest keywords', e);
        } finally {
            setSuggestingKeywords(false);
        }
    };

    const handleTopicSelect = (topicOption) => {
        const description = topicOption.short_description || '';
        setForm(prev => ({ ...prev, topic: topicOption.topic, description }));
        suggestKeywords(topicOption.topic, description);
    };

    const runPlatform = async (platform) => {
        setBusy(prev => ({ ...prev, [platform]: true }));
        setErrors(prev => ({ ...prev, [platform]: '' }));
        try {
            const res = await PLATFORM_FIELDS[platform].generate(form);
            setResults(prev => ({ ...prev, [platform]: res.data }));
        } catch (e) {
            setErrors(prev => ({ ...prev, [platform]: e.message || 'Failed to generate.' }));
        } finally {
            setBusy(prev => ({ ...prev, [platform]: false }));
        }
    };

    const handleGenerateAll = async () => {
        if (!form.topic || !form.description || !form.keywords || !form.cta_link) {
            alert('Please fill in topic, description, keywords, and CTA link.');
            return;
        }
        setGenerating(true);
        setResults({});
        setErrors({});
        await Promise.allSettled(PLATFORM_KEYS.map(runPlatform));
        setGenerating(false);
    };

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
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl text-gray-900">Social Copy Generator</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Generate SEO-optimized titles, descriptions, hashtags, and tags for YouTube Shorts, Instagram
                    Reels, Facebook, X, and LinkedIn — copy each field into the platform's own posting screen.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Content Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TopicDropdown
                        value={form.topic}
                        topics={topics}
                        onSelect={handleTopicSelect}
                        onChangeText={(value) => updateField('topic', value)}
                    />
                    <TextArea
                        label="Description / script summary"
                        fullWidth
                        rows={3}
                        placeholder="Short summary of what the video shows..."
                        value={form.description}
                        onChange={(e) => updateField('description', e.target.value)}
                    />
                    <Input
                        label={suggestingKeywords ? 'Target keyword(s) (generating...)' : 'Target keyword(s)'}
                        fullWidth
                        placeholder="e.g. online astrologer, kundli reading, career astrology"
                        value={form.keywords}
                        disabled={suggestingKeywords}
                        onChange={(e) => updateField('keywords', e.target.value)}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="CTA link"
                            fullWidth
                            value={form.cta_link}
                            onChange={(e) => updateField('cta_link', e.target.value)}
                        />
                        <Input
                            label="Price (optional)"
                            fullWidth
                            value={form.price}
                            onChange={(e) => updateField('price', e.target.value)}
                        />
                        <Input
                            label="Language"
                            fullWidth
                            value={form.language}
                            onChange={(e) => updateField('language', e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGenerateAll} disabled={generating}>
                        {generating ? 'Generating...' : 'Generate All'}
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {PLATFORM_KEYS.map((platform) => {
                    const config = PLATFORM_FIELDS[platform];
                    const result = results[platform];
                    const error = errors[platform];
                    const isBusy = busy[platform];

                    return (
                        <div key={platform} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{config.label}</span>
                                {(result || error) && (
                                    <button
                                        type="button"
                                        onClick={() => runPlatform(platform)}
                                        disabled={isBusy}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                    >
                                        <RefreshCw size={11} className={isBusy ? 'animate-spin' : ''} />
                                        {isBusy ? 'Regenerating...' : 'Regenerate'}
                                    </button>
                                )}
                            </div>

                            {error && (
                                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{error}</p>
                            )}

                            {!result && !error && (
                                <p className="text-xs text-slate-400">
                                    {isBusy ? 'Generating...' : 'Fill the form above and click Generate All.'}
                                </p>
                            )}

                            {result && config.fields.map(({ key, label, rows }) => {
                                const fieldId = `${platform}-${key}`;
                                return (
                                    <div key={fieldId} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">{label}</label>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(fieldId, result[key])}
                                                disabled={!result[key]}
                                                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                                            >
                                                {copiedField === fieldId ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                            style={{ height: `${Math.max(rows, 1) * 20 + 12}px` }}
                                            value={result[key] || ''}
                                            onChange={(e) => setResults(prev => ({
                                                ...prev,
                                                [platform]: { ...prev[platform], [key]: e.target.value },
                                            }))}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
