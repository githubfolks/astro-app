import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cms } from '../../services/api';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Button, Input, Card } from '../../components/ui';
import { ChevronLeft } from 'lucide-react';

export default function PostEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        featured_image: '',
        status: 'DRAFT',
    });

    const slugify = (text) => {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-');        // Replace multiple - with single -
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await cms.posts.get(id);
                setFormData({
                    title: response.data.title,
                    slug: response.data.slug || '',
                    content: response.data.content,
                    featured_image: response.data.featured_image || '',
                    status: response.data.status,
                });
            } catch (error) {
                console.error('Failed to fetch post', error);
            }
        };

        if (isEdit) {
            fetchPost();
        }
    }, [id, isEdit]);

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setFormData(prev => {
            const shouldUpdateSlug = !prev.slug || prev.slug === slugify(prev.title);
            return {
                ...prev,
                title: newTitle,
                slug: shouldUpdateSlug ? slugify(newTitle) : prev.slug
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await cms.posts.update(id, formData);
            } else {
                await cms.posts.create(formData);
            }
            navigate('/cms/posts');
        } catch (error) {
            console.error('Failed to save post', error);
        }
    };


    return (
        <div className="space-y-6 max-w-6xl mx-auto p-2">
            {/* Header Navigation */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/cms/posts')}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer"
                        title="Back to posts"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Content / Blog</span>
                        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit Post' : 'New Post'}</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outlined" onClick={() => navigate('/cms/posts')} className="cursor-pointer">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="cursor-pointer">
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Editor Workspace */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Left Side: Document Workspace */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-6">
                    <input
                        type="text"
                        className="w-full text-3xl font-extrabold text-slate-800 placeholder-slate-300 focus:outline-none border-b border-slate-100 pb-4"
                        placeholder="Enter post title here..."
                        value={formData.title || ''}
                        onChange={handleTitleChange}
                        required
                    />
                    <div className="min-h-[500px]">
                        <RichTextEditor
                            value={formData.content || ''}
                            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                            className="h-[500px]"
                        />
                    </div>
                </div>

                {/* Right Side: Settings Panel */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-5 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                        <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Publish Settings</h3>
                        
                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">Status</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="PUBLISHED">Published</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>

                        <div>
                            <Input
                                label="Slug"
                                placeholder="post-slug-url"
                                value={formData.slug || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                className="border-slate-200"
                            />
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Featured Image URL"
                                placeholder="https://example.com/image.jpg"
                                value={formData.featured_image || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                                className="border-slate-200"
                            />
                            {formData.featured_image && (
                                <div className="space-y-1.5">
                                    <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Preview</span>
                                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                        <img 
                                            src={formData.featured_image} 
                                            alt="Featured preview" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    );
}

