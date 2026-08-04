import React, { useCallback, useEffect, useState } from 'react';
import { X, Trash2, Sparkles } from 'lucide-react';
import { cms } from '../services/api';
import { Button } from './ui/Button';
import { TextArea } from './ui/TextArea';

const toAbsoluteUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const LIMIT = 24;

export function GalleryModal({ onClose, onSelect }) {
    const [images, setImages] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [generating, setGenerating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const fetchImages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await cms.gallery.list({ skip: 0, limit: LIMIT });
            setImages(res.data.images);
            setTotal(res.data.total);
        } catch (e) {
            console.error('Failed to fetch gallery images', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchImages(); }, [fetchImages]);

    const loadMore = async () => {
        try {
            const res = await cms.gallery.list({ skip: images.length, limit: LIMIT });
            setImages(prev => [...prev, ...res.data.images]);
            setTotal(res.data.total);
        } catch (e) {
            alert(e.message || 'Failed to load more images.');
        }
    };

    const handleGenerate = async () => {
        if (!content.trim()) {
            alert('Enter some content to generate an image from.');
            return;
        }
        setGenerating(true);
        try {
            const res = await cms.gallery.generate({ content: content.trim() });
            setImages(prev => [res.data, ...prev]);
            setTotal(prev => prev + 1);
            setContent('');
        } catch (e) {
            alert(e.message || 'Failed to generate image.');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (image) => {
        if (!window.confirm('Delete this image from the gallery? This cannot be undone.')) return;
        setDeletingId(image.id);
        try {
            await cms.gallery.delete(image.id);
            setImages(prev => prev.filter(img => img.id !== image.id));
            setTotal(prev => prev - 1);
        } catch (e) {
            alert(e.message || 'Failed to delete image.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
                    <h3 className="font-semibold text-slate-800">Image Gallery</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-end gap-2">
                        <TextArea
                            fullWidth
                            label="Generate a new image"
                            placeholder="Describe what the image should depict..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={generating}
                            className="h-16"
                        />
                        <Button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="h-10 whitespace-nowrap cursor-pointer gap-1.5"
                        >
                            <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>

                    <div>
                        {loading ? (
                            <p className="text-sm text-slate-400 text-center py-8">Loading gallery...</p>
                        ) : images.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">No images in the gallery yet. Generate one above.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {images.map((image) => (
                                        <div
                                            key={image.id}
                                            className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer"
                                            onClick={() => onSelect(toAbsoluteUrl(image.url))}
                                            title={image.prompt || ''}
                                        >
                                            <img
                                                src={toAbsoluteUrl(image.url)}
                                                alt={image.prompt || 'Gallery image'}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                title="Delete from gallery"
                                                disabled={deletingId === image.id}
                                                onClick={(e) => { e.stopPropagation(); handleDelete(image); }}
                                                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer disabled:opacity-50"
                                            >
                                                <Trash2 size={14} className="text-red-600" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {images.length < total && (
                                    <div className="text-center pt-4">
                                        <Button variant="outlined" size="sm" onClick={loadMore} className="cursor-pointer">
                                            Load more
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
