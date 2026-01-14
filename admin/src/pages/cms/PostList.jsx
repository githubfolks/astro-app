import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { cms } from '../../services/api';
import clsx from 'clsx';

export default function PostList() {
    const [posts, setPosts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 20;
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, [page]);

    const fetchPosts = async () => {
        try {
            const response = await cms.posts.list({ skip: (page - 1) * limit, limit });
            setPosts(response.data.posts);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await cms.posts.delete(id);
                fetchPosts();
            } catch (error) {
                console.error('Failed to delete post', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
                <Button onClick={() => navigate('/cms/posts/new')}>
                    <Plus size={16} className="mr-2" /> New Post
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {posts.map((post) => (
                            <TableRow key={post.id}>
                                <TableCell className="font-medium">{post.title}</TableCell>
                                <TableCell>
                                    <span className={clsx(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                        post.status === 'PUBLISHED' ? "bg-green-100 text-green-800" :
                                            post.status === 'ARCHIVED' ? "bg-gray-100 text-gray-800" :
                                                "bg-yellow-100 text-yellow-800"
                                    )}>
                                        {post.status}
                                    </span>
                                </TableCell>
                                <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/cms/posts/edit/${post.id}`)}>
                                        <Edit2 size={18} className="text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                                        <Trash2 size={18} className="text-red-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {posts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                    No posts found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Simple Pagination */}
                {Math.ceil(total / limit) > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
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
        </div>
    );
}
