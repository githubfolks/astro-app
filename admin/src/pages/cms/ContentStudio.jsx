import React, { useEffect, useRef, useState } from 'react';
import { contentStudio } from '../../services/api';
import { Button, Card, TextArea } from '../../components/ui';

const toAbsoluteUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 10 * 60_000;

export default function ContentStudio() {
    const [topic, setTopic] = useState('');
    const [contentType, setContentType] = useState('SHORT_VIDEO');
    const [voiceGender, setVoiceGender] = useState('FEMALE');
    const [sceneCount, setSceneCount] = useState('');

    const [job, setJob] = useState(null);
    const [scenes, setScenes] = useState([]);
    const [imageBusy, setImageBusy] = useState({}); // sceneIndex -> true while generating

    const [suggesting, setSuggesting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rendering, setRendering] = useState(false);
    const [error, setError] = useState('');

    const pollRef = useRef(null);
    const pollTimeoutRef = useRef(null);
    // Serializes every generate-image call (auto-loop and manual "Regenerate"
    // clicks alike) so only one is ever in flight for this job at a time --
    // overlapping calls raced on the shared scenes JSON and clobbered each
    // other's image_url updates.
    const imageQueueRef = useRef(Promise.resolve());

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        };
    }, []);

    const stopPolling = () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
    };

    const startPolling = (jobId) => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const res = await contentStudio.getJob(jobId);
                setJob(res.data);
                setScenes(res.data.scenes || []);
                if (res.data.status === 'DONE' || res.data.status === 'FAILED') {
                    stopPolling();
                    setRendering(false);
                }
            } catch (e) {
                console.error(e);
            }
        }, POLL_INTERVAL_MS);
        pollTimeoutRef.current = setTimeout(() => {
            stopPolling();
            setRendering(false);
        }, POLL_TIMEOUT_MS);
    };

    const handleSuggestTopic = async () => {
        setSuggesting(true);
        try {
            const res = await contentStudio.suggestTopic();
            setTopic(res.data.topic || '');
        } catch (e) {
            alert(e.message || 'Failed to suggest a topic.');
        } finally {
            setSuggesting(false);
        }
    };

    const generateSceneImage = (jobId, scene) => {
        const run = async () => {
            setImageBusy(prev => ({ ...prev, [scene.index]: true }));
            try {
                const res = await contentStudio.generateSceneImage(jobId, scene.index, scene.image_prompt_en);
                const updatedScene = (res.data.scenes || []).find(s => s.index === scene.index);
                if (updatedScene) {
                    setScenes(prev => prev.map(s => (s.index === scene.index ? updatedScene : s)));
                }
            } catch (e) {
                alert(e.message || `Failed to generate image for scene ${scene.index + 1}.`);
            } finally {
                setImageBusy(prev => ({ ...prev, [scene.index]: false }));
            }
        };
        // Chain onto the shared queue regardless of outcome so one failure
        // doesn't permanently block later scenes from generating.
        imageQueueRef.current = imageQueueRef.current.then(run, run);
        return imageQueueRef.current;
    };

    const handleGenerateScenes = async () => {
        if (!topic.trim()) {
            alert('Please enter a topic first.');
            return;
        }
        setError('');
        setGenerating(true);
        try {
            const res = await contentStudio.generateScenes({
                topic: topic.trim(),
                content_type: contentType,
                voice_gender: voiceGender,
                scene_count: sceneCount ? Number(sceneCount) : null,
            });
            setJob(res.data);
            const newScenes = res.data.scenes || [];
            setScenes(newScenes);
            // Kick off preview image generation for every scene right away, one at
            // a time -- firing them all in parallel reliably triggers Pollinations'
            // rate limit once there are 3+ scenes.
            (async () => {
                for (const scene of newScenes) {
                    await generateSceneImage(res.data.id, scene);
                }
            })();
        } catch (e) {
            alert(e.message || 'Failed to generate scenes.');
        } finally {
            setGenerating(false);
        }
    };

    const handleSceneFieldChange = (index, field, value) => {
        setScenes(prev => prev.map(s => (s.index === index ? { ...s, [field]: value } : s)));
    };

    const handleSaveScenes = async () => {
        if (!job) return;
        setSaving(true);
        try {
            const res = await contentStudio.updateScenes(job.id, scenes);
            setJob(res.data);
            setScenes(res.data.scenes || []);
        } catch (e) {
            alert(e.message || 'Failed to save scene edits.');
        } finally {
            setSaving(false);
        }
    };

    const handleRender = async () => {
        if (!job) return;
        setError('');
        setRendering(true);
        try {
            const res = await contentStudio.renderVideo(job.id);
            setJob(res.data);
            startPolling(job.id);
        } catch (e) {
            setRendering(false);
            alert(e.message || 'Failed to start rendering.');
        }
    };

    const isFailed = job?.status === 'FAILED';
    const isDone = job?.status === 'DONE';
    const isRendering = job?.status === 'RENDERING' || rendering;
    const anyImageBusy = Object.values(imageBusy).some(Boolean);
    const allImagesReady = scenes.length > 0 && scenes.every(s => !!s.image_url);

    return (
        <div className="space-y-6 w-full p-2">
            <div className="border-b border-slate-200 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Content / Studio</span>
                <h1 className="text-2xl font-bold text-slate-800">Content Studio</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Turn a topic into a narrated Vedic astrology video for Facebook, Instagram, and YouTube — generate scenes, review each image, then render.
                </p>
            </div>

            <Card className="p-6 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 text-sm">1. Topic</h3>
                    <Button variant="outlined" size="sm" onClick={handleSuggestTopic} disabled={suggesting} className="cursor-pointer">
                        {suggesting ? 'Thinking...' : 'Generate Topic with AI'}
                    </Button>
                </div>
                <TextArea
                    fullWidth
                    placeholder="e.g. What Shani's transit through Kumbh Rashi means for career"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-20"
                />
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Content type</label>
                        <select
                            className="flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={contentType}
                            onChange={(e) => setContentType(e.target.value)}
                        >
                            <option value="SHORT_VIDEO">Short Video</option>
                            <option value="VOICE_OVER_IMAGE">Voice-over Image</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Voice</label>
                        <select
                            className="flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={voiceGender}
                            onChange={(e) => setVoiceGender(e.target.value)}
                        >
                            <option value="FEMALE">Female</option>
                            <option value="MALE">Male</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Scene count (optional)</label>
                        <input
                            type="number"
                            min="1"
                            max="8"
                            placeholder="auto"
                            className="flex h-10 w-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={sceneCount}
                            onChange={(e) => setSceneCount(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGenerateScenes} disabled={generating} className="cursor-pointer">
                        {generating ? 'Generating Scenes...' : 'Generate Scenes'}
                    </Button>
                </div>
            </Card>

            {scenes.length > 0 && (
                <Card className="p-6 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-semibold text-slate-800 text-sm">2. Review scenes &amp; images</h3>
                        <Button variant="outlined" size="sm" onClick={handleSaveScenes} disabled={saving} className="cursor-pointer">
                            {saving ? 'Saving...' : 'Save Narration Edits'}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {scenes.map((scene) => (
                            <div key={scene.index} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 md:flex md:gap-4 md:space-y-0">
                                <div className="md:w-48 md:flex-shrink-0">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scene {scene.index + 1}</span>
                                    <div className="mt-2 aspect-[9/16] w-full max-w-[180px] bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                                        {imageBusy[scene.index] ? (
                                            <span className="text-xs text-slate-500 px-2 text-center">Generating image...</span>
                                        ) : scene.image_url ? (
                                            <img src={toAbsoluteUrl(scene.image_url)} alt={`Scene ${scene.index + 1}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-slate-400 px-2 text-center">No image yet</span>
                                        )}
                                    </div>
                                    <Button
                                        variant="outlined"
                                        size="sm"
                                        onClick={() => generateSceneImage(job.id, scene)}
                                        disabled={!!imageBusy[scene.index]}
                                        className="cursor-pointer mt-2 w-full max-w-[180px]"
                                    >
                                        {imageBusy[scene.index] ? 'Working...' : (scene.image_url ? 'Regenerate Image' : 'Generate Image')}
                                    </Button>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <TextArea
                                        fullWidth
                                        label="Hindi narration"
                                        value={scene.narration_hi}
                                        onChange={(e) => handleSceneFieldChange(scene.index, 'narration_hi', e.target.value)}
                                        className="h-20"
                                    />
                                    <TextArea
                                        fullWidth
                                        label="Image prompt (English) — edit, then Regenerate Image to preview"
                                        value={scene.image_prompt_en}
                                        onChange={(e) => handleSceneFieldChange(scene.index, 'image_prompt_en', e.target.value)}
                                        className="h-16"
                                    />
                                    {scene.full_image_prompt && (
                                        <details className="text-xs text-slate-500">
                                            <summary className="cursor-pointer select-none hover:text-slate-700">Show exact prompt sent to image API</summary>
                                            <p className="mt-1 p-2 bg-slate-100 rounded-md font-mono whitespace-pre-wrap">{scene.full_image_prompt}</p>
                                        </details>
                                    )}
                                    {scene.error && (
                                        <p className="text-xs text-red-500">Last render error for this scene: {scene.error}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                            {isRendering && <p className="text-sm text-slate-500">Rendering — generating voice and assembling video. This can take a few minutes.</p>}
                            {isFailed && <p className="text-sm text-red-500">Render failed: {job.error_message}</p>}
                            {!isRendering && !allImagesReady && <p className="text-sm text-amber-600">Generate an image for every scene before rendering.</p>}
                        </div>
                        <Button onClick={handleRender} disabled={isRendering || saving || anyImageBusy || !allImagesReady} className="cursor-pointer">
                            {isRendering ? 'Rendering...' : 'Render Video'}
                        </Button>
                    </div>
                </Card>
            )}

            {isDone && job.output_video_url && (
                <Card className="p-6 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-4">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">3. Preview &amp; download</h3>
                    <video controls className="max-w-sm rounded-lg border border-slate-200" src={toAbsoluteUrl(job.output_video_url)} />
                    <div>
                        <a
                            href={toAbsoluteUrl(job.output_video_url)}
                            download
                            className="inline-block"
                        >
                            <Button variant="outlined" className="cursor-pointer">Download Video</Button>
                        </a>
                    </div>
                    <p className="text-xs text-slate-400">Vertical 1080×1920 — ready to post manually to Facebook Reels, Instagram Reels, and YouTube Shorts.</p>
                </Card>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
