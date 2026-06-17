import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { Button, Switch, Avatar } from '../components/ui';

export default function Astrologers() {
    const navigate = useNavigate();
    const [astrologers, setAstrologers] = useState([]);

    const fetchAstrologers = useCallback(async () => {
        try {
            const response = await api.get('/admin/astrologers_full');
            setAstrologers(response.data.astrologers);
        } catch (error) {
            console.error("Failed to fetch astrologers", error);
        }
    }, []);

    useEffect(() => {
        fetchAstrologers();
    }, [fetchAstrologers]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure? This will delete the account and profile.")) {
            try {
                await api.delete(`/admin/users/${id}`);
                fetchAstrologers();
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    const handleToggleStatus = async (item, newStatus) => {
        setAstrologers(astrologers.map(a => a.id === item.id ? { ...a, is_active: newStatus } : a));
        try {
            await api.put(`/admin/users/${item.id}/status`, { is_active: newStatus });
        } catch (error) {
            console.error("Status toggle failed", error);
            fetchAstrologers();
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Astrologers</h1>
                    <p className="text-gray-500 mt-1">Manage your astrologer verification and profiles</p>
                </div>
                <Button onClick={() => navigate('/astrologers/add')} className="gap-2 shadow-sm">
                    <Plus size={20} />
                    Add Astrologer
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {astrologers.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col group h-full relative">
                        <div
                            className="p-5 flex flex-col items-center text-center border-b border-gray-50 flex-grow cursor-pointer hover:bg-gray-50/30 transition-colors"
                            onClick={() => navigate(`/astrologers/view/${item.id}`)}
                        >
                            <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                                {/* Status Toggle */}
                                <Switch
                                    checked={item.is_active !== false}
                                    onCheckedChange={(checked) => handleToggleStatus(item, checked)}
                                />
                            </div>

                            <Avatar
                                src={item.profile?.profile_picture_url}
                                className="w-20 h-20 border-4 border-gray-50 shadow-inner mb-3"
                                iconSize={40}
                            />
                            <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">{item.profile?.full_name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-3 leading-relaxed">{item.profile?.short_bio}</p>

                            <div className="flex gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full border border-blue-100">
                                    {item.profile?.experience_years}y Exp
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded-full border border-emerald-100">
                                    ₹{item.profile?.consultation_fee_per_min}/m
                                </span>
                            </div>

                            <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase line-clamp-1">
                                {item.profile?.specialties}
                            </p>
                        </div>

                        <div className="bg-gray-50/50 p-2 flex justify-between items-center gap-2">
                            <Button
                                variant="outlined"
                                className="flex-1 text-xs h-8 gap-1.5 shadow-sm"
                                onClick={() => navigate(`/astrologers/edit/${item.id}`)}
                            >
                                <Edit2 size={12} /> Edit
                            </Button>
                            <Button
                                variant="danger"
                                className="p-1 h-8 w-8 bg-white border border-red-100 text-red-600 hover:bg-red-50 shadow-sm"
                                onClick={() => handleDelete(item.id)}
                            >
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
