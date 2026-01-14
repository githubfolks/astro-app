import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { cms } from '../../services/api';

export default function PageList() {
    const [pages, setPages] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 20;
    const navigate = useNavigate();

    useEffect(() => {
        fetchPages();
    }, [page]);

    const fetchPages = async () => {
        try {
            const response = await cms.pages.list({ skip: (page - 1) * limit, limit });
            setPages(response.data.pages);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Failed to fetch pages', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this page?')) {
            try {
                await cms.pages.delete(id);
                fetchPages();
            } catch (error) {
                console.error('Failed to delete page', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Static Pages</h1>
                <Button onClick={() => navigate('/cms/pages/new')}>
                    <Plus size={16} className="mr-2" /> New Page
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pages.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.title}</TableCell>
                                <TableCell className="text-gray-500">{p.slug}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/cms/pages/edit/${p.id}`)}>
                                        <Edit2 size={18} className="text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                                        <Trash2 size={18} className="text-red-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {pages.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                    No pages found
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
