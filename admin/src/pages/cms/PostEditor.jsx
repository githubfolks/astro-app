import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cms } from '../../services/api';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Button, Input, Card } from '../../components/ui';

export default function PostEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        featured_image: '',
        status: 'DRAFT',
    });

    useEffect(() => {
        if (isEdit) {
            fetchPost();
        }
    }, [id]);

    const fetchPost = async () => {
        try {
            const response = await cms.posts.get(id);
            setFormData({
                title: response.data.title,
                content: response.data.content,
                featured_image: response.data.featured_image || '',
                status: response.data.status,
            });
        } catch (error) {
            console.error('Failed to fetch post', error);
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Post' : 'New Post'}</h1>
                <div className="flex gap-2">
                    <Button variant="outlined" onClick={() => navigate('/cms/posts')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Save
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-3">
                            <Input
                                label="Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                fullWidth
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="PUBLISHED">Published</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Content</label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(content) => setFormData({ ...formData, content })}
                            className="h-[600px]"
                        />
                    </div>
                </Card>
            </form>
        </div>
    );
}
