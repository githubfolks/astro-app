import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cms } from '../../services/api';
import { RichTextEditor } from '../../components/RichTextEditor';
import { GalleryModal } from '../../components/GalleryModal';
import { Button, Input, Card } from '../../components/ui';
import { ChevronLeft, Eye, X, Images, Plus, Trash2, Copy, Check } from 'lucide-react';

// The API returns relative /static/... paths for uploaded/generated images.
// admin.aadikarta.org and api.aadikarta.org are different origins, so a
// relative path 404s when used directly as an <img src> or a Graph API
// photo URL -- resolve to an absolute URL before it's stored or rendered.
const toAbsoluteUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

function PreviewModal({ post, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <Eye size={18} className="text-slate-500" />
                        <span className="font-semibold text-slate-800">Draft Preview</span>
                        <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Not published</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <article className="p-8">
                    <header className="mb-10 text-center">
                        <h1 className="text-3xl md:text-4xl text-gray-900 mb-4 leading-tight">{post.title || 'Untitled post'}</h1>
                        {post.featured_image && (
                            <div className="mt-6 rounded-2xl overflow-hidden shadow-lg">
                                <img src={toAbsoluteUrl(post.featured_image)} alt={post.title} className="w-full h-auto max-h-[420px] object-cover" />
                            </div>
                        )}
                    </header>
                    <div
                        className="post-content prose prose-indigo max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content || '<p class="text-slate-400">No content yet.</p>' }}
                    />
                </article>
            </div>
        </div>
    );
}

export default function PostEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image: '',
        author_name: '',
        faqs: [],
        seo_keywords_facebook: '',
        seo_keywords_instagram: '',
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
                    excerpt: response.data.excerpt || '',
                    featured_image: response.data.featured_image || '',
                    author_name: response.data.author_name || '',
                    faqs: response.data.faqs || [],
                    seo_keywords_facebook: response.data.seo_keywords_facebook || '',
                    seo_keywords_instagram: response.data.seo_keywords_instagram || '',
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

    const [showPreview, setShowPreview] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
    const [generatingFeaturedImage, setGeneratingFeaturedImage] = useState(false);

    const handleGenerateFeaturedImage = async () => {
        if (!formData.title || !formData.content) {
            alert('Please enter a title and body content first.');
            return;
        }
        setGeneratingFeaturedImage(true);
        try {
            const res = await cms.posts.generateFeaturedImage({
                title: formData.title,
                content: formData.content,
            });
            setFormData(prev => ({ ...prev, featured_image: toAbsoluteUrl(res.data.url) }));
        } catch (e) {
            alert(e.message || 'Failed to generate featured image.');
        } finally {
            setGeneratingFeaturedImage(false);
        }
    };

    const handleFeaturedImagePaste = async (e) => {
        const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
        if (!item) return;

        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        setUploadingFeaturedImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await cms.upload(formData);
            setFormData(prev => ({ ...prev, featured_image: toAbsoluteUrl(res.data.url) }));
        } catch (err) {
            alert(err.message || 'Failed to upload pasted image.');
        } finally {
            setUploadingFeaturedImage(false);
        }
    };

    const [xPostText, setXPostText] = useState('');
    const [xTags, setXTags] = useState('');
    const [generatingX, setGeneratingX] = useState(false);
    const [linkedinPostText, setLinkedinPostText] = useState('');
    const [linkedinTags, setLinkedinTags] = useState('');
    const [generatingLinkedin, setGeneratingLinkedin] = useState(false);
    const [copiedField, setCopiedField] = useState('');

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

    const handleGenerateX = async () => {
        if (!formData.title || !formData.content) {
            alert('Please enter a title and content first.');
            return;
        }
        setGeneratingX(true);
        try {
            const res = await cms.posts.generateSocial({
                title: formData.title,
                content: formData.content,
                platform: 'twitter'
            });
            setXPostText(res.data.text);
            setXTags(res.data.tags || '');
        } catch (e) {
            alert(e.message || 'Failed to generate X post.');
        } finally {
            setGeneratingX(false);
        }
    };

    const handleGenerateLinkedin = async () => {
        if (!formData.title || !formData.content) {
            alert('Please enter a title and content first.');
            return;
        }
        setGeneratingLinkedin(true);
        try {
            const res = await cms.posts.generateSocial({
                title: formData.title,
                content: formData.content,
                platform: 'linkedin'
            });
            setLinkedinPostText(res.data.text);
            setLinkedinTags(res.data.tags || '');
        } catch (e) {
            alert(e.message || 'Failed to generate LinkedIn post.');
        } finally {
            setGeneratingLinkedin(false);
        }
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

    const addFaq = () => {
        setFormData(prev => ({ ...prev, faqs: [...(prev.faqs || []), { question: '', answer: '' }] }));
    };

    const updateFaq = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
        }));
    };

    const removeFaq = (index) => {
        setFormData(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            faqs: (formData.faqs || []).filter(faq => faq.question.trim() && faq.answer.trim()),
        };
        try {
            if (isEdit) {
                await cms.posts.update(id, payload);
            } else {
                await cms.posts.create(payload);
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
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-900 cursor-pointer"
                        title="Back to posts"
                        type="button"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Content / Blog</span>
                        <h1 className="text-2xl text-slate-800">{isEdit ? 'Edit Post' : 'New Post'}</h1>
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
                    {isEdit && formData.status === 'DRAFT' && (
                        <Button
                            variant="outlined"
                            onClick={() => setShowPreview(true)}
                            className="cursor-pointer gap-1.5"
                            type="button"
                        >
                            <Eye size={16} /> Preview
                        </Button>
                    )}
                    <Button variant="outlined" onClick={() => navigate('/cms/posts')} className="cursor-pointer" type="button">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="cursor-pointer" type="submit">
                        Save Changes
                    </Button>
                </div>
            </div>

            {showPreview && (
                <PreviewModal post={formData} onClose={() => setShowPreview(false)} />
            )}

            {showGallery && (
                <GalleryModal
                    onClose={() => setShowGallery(false)}
                    onSelect={(url) => {
                        setFormData(prev => ({ ...prev, featured_image: url }));
                        setShowGallery(false);
                    }}
                />
            )}

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

                    {/* Author Name */}
                    <div>
                        <Input
                            label="Author Name"
                            placeholder="e.g. Acharya Raman (optional — shown as byline, falls back to Aadikarta Vedic Astrology)"
                            value={formData.author_name || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                            className="border-slate-200"
                        />
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Excerpt</label>
                        <textarea
                            className="w-full text-sm border border-slate-200 rounded-lg p-3 h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="Short summary used as the meta description and social-share preview — falls back to auto-stripped content if left blank."
                            value={formData.excerpt || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                        />
                    </div>

                    {/* Featured Image URL (Below Slug) */}
                    <div className="space-y-4">
                        <div className="flex items-end gap-2">
                            <Input
                                label="Featured Image URL"
                                placeholder="https://example.com/image.jpg (or paste an image)"
                                value={generatingFeaturedImage ? 'Generating...' : (uploadingFeaturedImage ? 'Uploading...' : (formData.featured_image || ''))}
                                onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                                onPaste={handleFeaturedImagePaste}
                                disabled={uploadingFeaturedImage || generatingFeaturedImage}
                                className="border-slate-200"
                                fullWidth
                            />
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={handleGenerateFeaturedImage}
                                disabled={generatingFeaturedImage || uploadingFeaturedImage}
                                className="h-10 whitespace-nowrap cursor-pointer"
                            >
                                {generatingFeaturedImage ? 'Generating...' : 'Generate Image'}
                            </Button>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => setShowGallery(true)}
                                disabled={generatingFeaturedImage || uploadingFeaturedImage}
                                className="h-10 whitespace-nowrap cursor-pointer gap-1.5"
                            >
                                <Images size={16} /> Gallery
                            </Button>
                        </div>
                        {formData.featured_image && (
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider font-medium">Image Preview</span>
                                <div className="max-w-md aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                    <img
                                        src={toAbsoluteUrl(formData.featured_image)}
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

                {/* FAQs — rendered on the public post as an FAQ section and FAQPage
                    structured data, so answer engines (Google AI Overviews,
                    Perplexity, ChatGPT) can lift a direct Q&A straight from the article. */}
                <Card className="p-6 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <div className="border-b border-slate-100 pb-3 mb-4">
                        <h3 className="font-semibold text-slate-800 text-sm">FAQs (optional)</h3>
                    </div>

                    {(!formData.faqs || formData.faqs.length === 0) ? (
                        <p className="text-xs text-slate-400 mb-4">No FAQs yet. Add a question your article already answers.</p>
                    ) : (
                        <div className="space-y-4 mb-4">
                            {formData.faqs.map((faq, index) => (
                                <div key={index} className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            className="w-full text-sm font-medium border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Question"
                                            value={faq.question}
                                            onChange={(e) => updateFaq(index, 'question', e.target.value)}
                                        />
                                        <textarea
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Answer"
                                            value={faq.answer}
                                            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFaq(index)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Remove FAQ"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button type="button" variant="outlined" onClick={addFaq} className="cursor-pointer gap-1.5 text-xs h-8">
                        <Plus size={14} /> Add FAQ
                    </Button>
                </Card>

                {/* Social Media Sharing (Below FAQs) — Facebook/Instagram publish
                    directly via the Graph API. X.com and LinkedIn have no publish
                    API configured, so AI Generate produces post content and hashtags
                    as two separately copyable blocks for manual posting. */}
                <Card className="p-6 border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">Social Media Sharing</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* Facebook Section */}
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Facebook Page</span>
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
                            <div className="space-y-1 pt-1 border-t border-slate-200">
                                <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">SEO Keywords (Facebook)</label>
                                <textarea
                                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 h-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Comma-separated keywords for Facebook discovery..."
                                    value={formData.seo_keywords_facebook || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords_facebook: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Instagram Section */}
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Instagram Business</span>
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
                            <div className="space-y-1 pt-1 border-t border-slate-200">
                                <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">SEO Keywords (Instagram)</label>
                                <textarea
                                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 h-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Comma-separated keywords for Instagram discovery..."
                                    value={formData.seo_keywords_instagram || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, seo_keywords_instagram: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* X (Twitter) Section */}
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">X.com</span>
                                <button
                                    type="button"
                                    onClick={handleGenerateX}
                                    disabled={generatingX}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {generatingX ? 'Generating...' : 'AI Generate'}
                                </button>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Post Content</label>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy('x-text', xPostText)}
                                        disabled={!xPostText}
                                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                                    >
                                        {copiedField === 'x-text' ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Post content for X.com..."
                                    value={xPostText}
                                    onChange={(e) => setXPostText(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1 pt-1 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Tags</label>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy('x-tags', xTags)}
                                        disabled={!xTags}
                                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                                    >
                                        {copiedField === 'x-tags' ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 h-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Hashtags for X.com..."
                                    value={xTags}
                                    onChange={(e) => setXTags(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* LinkedIn Section */}
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">LinkedIn</span>
                                <button
                                    type="button"
                                    onClick={handleGenerateLinkedin}
                                    disabled={generatingLinkedin}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {generatingLinkedin ? 'Generating...' : 'AI Generate'}
                                </button>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Post Content</label>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy('linkedin-text', linkedinPostText)}
                                        disabled={!linkedinPostText}
                                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                                    >
                                        {copiedField === 'linkedin-text' ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Post content for LinkedIn..."
                                    value={linkedinPostText}
                                    onChange={(e) => setLinkedinPostText(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1 pt-1 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">Tags</label>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy('linkedin-tags', linkedinTags)}
                                        disabled={!linkedinTags}
                                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                                    >
                                        {copiedField === 'linkedin-tags' ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2 h-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Hashtags for LinkedIn..."
                                    value={linkedinTags}
                                    onChange={(e) => setLinkedinTags(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </form>
        </div>
    );
}

