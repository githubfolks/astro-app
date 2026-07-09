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

    const [fbPostText, setFbPostText] = useState('');
    const [igPostText, setIgPostText] = useState('');
    const [generatingFb, setGeneratingFb] = useState(false);
    const [generatingIg, setGeneratingIg] = useState(false);
    const [publishingFb, setPublishingFb] = useState(false);
    const [publishingIg, setPublishingIg] = useState(false);

    const handleGenerateFb = async () => {
        if (!formData.title || !formData.content) {
            alert('Please enter a title and content first.');
            return;
        }
        setGeneratingFb(true);
        try {
            const res = await cms.posts.generateSocial({
                title: formData.title,
                content: formData.content,
                platform: 'facebook'
            });
            setFbPostText(res.data.text);
        } catch (e) {
            alert(e.message || 'Failed to generate Facebook post.');
        } finally {
            setGeneratingFb(false);
        }
    };

    const handleGenerateIg = async () => {
        if (!formData.title || !formData.content) {
            alert('Please enter a title and content first.');
            return;
        }
        setGeneratingIg(true);
        try {
            const res = await cms.posts.generateSocial({
                title: formData.title,
                content: formData.content,
                platform: 'instagram'
            });
            setIgPostText(res.data.text);
        } catch (e) {
            alert(e.message || 'Failed to generate Instagram post.');
        } finally {
            setGeneratingIg(false);
        }
    };

    const handleShareFb = async () => {
        if (!fbPostText) return;
        setPublishingFb(true);
        try {
            await cms.posts.shareSocial(id, {
                platform: 'facebook',
                text: fbPostText
            });
            alert('Successfully published to Facebook!');
        } catch (e) {
            alert(e.message || 'Failed to publish to Facebook.');
        } finally {
            setPublishingFb(false);
        }
    };

    const handleShareIg = async () => {
        if (!igPostText) return;
        setPublishingIg(true);
        try {
            await cms.posts.shareSocial(id, {
                platform: 'instagram',
                text: igPostText
            });
            alert('Successfully published to Instagram!');
        } catch (e) {
            alert(e.message || 'Failed to publish to Instagram.');
        } finally {
            setPublishingIg(false);
        }
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
        <div className="space-y-6 w-full p-2">
            {/* Header Navigation */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/cms/posts')}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer"
                        title="Back to posts"
                        type="button"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Content / Blog</span>
                        <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit Post' : 'New Post'}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Publish Status Dropdown next to actions */}
                    <select
                        className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer font-medium text-slate-700"
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                    <Button variant="outlined" onClick={() => navigate('/cms/posts')} className="cursor-pointer" type="button">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="cursor-pointer" type="submit">
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Single Column Editor Workspace */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main Content Card - Full Width */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-6">
                    {/* Heading / Title Textbox */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase tracking-wider">Post Title</label>
                        <input
                            type="text"
                            className="w-full text-3xl font-extrabold text-slate-800 placeholder-slate-300 focus:outline-none border-b border-slate-100 pb-4"
                            placeholder="Enter post title here..."
                            value={formData.title || ''}
                            onChange={handleTitleChange}
                            required
                        />
                    </div>

                    {/* Slug Textbox (Below Heading) */}
                    <div>
                        <Input
                            label="Slug"
                            placeholder="post-slug-url"
                            value={formData.slug || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            className="border-slate-200"
                        />
                    </div>

                    {/* Featured Image URL (Below Slug) */}
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
                                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider font-medium">Image Preview</span>
                                <div className="max-w-md aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
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

                    {/* Editor (Expanded Full Width) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Editor Content</label>
                        <div className="min-h-[500px]">
                            <RichTextEditor
                                value={formData.content || ''}
                                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                className="h-[500px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Media Sharing & Instagram Business (Below Editor) */}
                <Card className="p-6 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">Social Media Sharing</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Facebook Section */}
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Facebook Page</span>
                                <button
                                    type="button"
                                    onClick={handleGenerateFb}
                                    disabled={generatingFb}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {generatingFb ? 'Generating...' : 'AI Generate'}
                                </button>
                            </div>
                            <textarea
                                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                placeholder="Facebook caption..."
                                value={fbPostText}
                                onChange={(e) => setFbPostText(e.target.value)}
                            />
                            <Button
                                type="button"
                                onClick={handleShareFb}
                                disabled={publishingFb || !fbPostText || !isEdit}
                                className="w-full text-xs h-9 justify-center cursor-pointer"
                                variant="outlined"
                            >
                                {publishingFb ? 'Publishing...' : 'Publish to Facebook'}
                            </Button>
                        </div>

                        {/* Instagram Section */}
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Instagram Business</span>
                                <button
                                    type="button"
                                    onClick={handleGenerateIg}
                                    disabled={generatingIg}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {generatingIg ? 'Generating...' : 'AI Generate'}
                                </button>
                            </div>
                            <textarea
                                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                placeholder="Instagram caption..."
                                value={igPostText}
                                onChange={(e) => setIgPostText(e.target.value)}
                            />
                            <Button
                                type="button"
                                onClick={handleShareIg}
                                disabled={publishingIg || !igPostText || !isEdit}
                                className="w-full text-xs h-9 justify-center cursor-pointer"
                                variant="outlined"
                            >
                                {publishingIg ? 'Publishing...' : 'Publish to Instagram'}
                            </Button>
                            {!isEdit && (
                                <p className="text-[10px] text-slate-400 text-center mt-2">Save this blog post first to enable publishing.</p>
                            )}
                        </div>
                    </div>
                </Card>
            </form>
        </div>
    );
}

