import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cms } from '../../services/api';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Button, Input, TextArea, Card } from '../../components/ui';

export default function PageEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        seo_title: '',
        seo_description: '',
    });

    useEffect(() => {
        if (isEdit) {
            fetchPage();
        }
    }, [id]);

    const fetchPage = async () => {
        try {
            const response = await cms.pages.get(id);
            setFormData({
                title: response.data.title,
                slug: response.data.slug,
                content: response.data.content,
                seo_title: response.data.seo_title || '',
                seo_description: response.data.seo_description || '',
            });
        } catch (error) {
            console.error('Failed to fetch page', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await cms.pages.update(id, formData);
            } else {
                await cms.pages.create(formData);
            }
            navigate('/cms/pages');
        } catch (error) {
            console.error('Failed to save page', error);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Page' : 'New Page'}</h1>
                <div className="flex gap-2">
                    <Button variant="outlined" onClick={() => navigate('/cms/pages')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Save
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6 space-y-4">
                    <Input
                        label="Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        fullWidth
                    />

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Content</label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(content) => setFormData({ ...formData, content })}
                            className="h-[600px]"
                        />
                    </div>
                </Card>

                <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">SEO & Settings</h3>
                    <div className="space-y-4">
                        <Input
                            label="Slug (URL Path)"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="my-page-url"
                            helperText="Leave empty to auto-generate from title"
                            fullWidth
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="SEO Title"
                                value={formData.seo_title}
                                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                                fullWidth
                            />
                            <TextArea
                                label="SEO Description"
                                value={formData.seo_description}
                                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                                fullWidth
                                rows={3}
                            />
                        </div>
                    </div>
                </Card>
            </form>
        </div>
    );
}
