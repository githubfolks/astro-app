import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Crown, Search } from 'lucide-react';
import api from '../services/api';
import { Button, Switch, Avatar } from '../components/ui';

// Mirrors the STAGES list in AstrologerOnboarding.jsx so the badge shown here
// matches the Kanban column the astrologer currently sits in.
const STAGE_INFO = {
    APPLIED: { label: 'Applied', classes: 'bg-gray-100 text-gray-700' },
    INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', classes: 'bg-blue-50 text-blue-700' },
    PROFILE_ACTIVATED: { label: 'Profile Activated', classes: 'bg-indigo-50 text-indigo-700' },
    ONBOARDING_INTIMATED: { label: 'Onboarding Intimated', classes: 'bg-violet-50 text-violet-700' },
    ONBOARDING_STARTED: { label: 'Onboarding Started', classes: 'bg-purple-50 text-purple-700' },
    TRAINING_SCHEDULED: { label: 'Training Scheduled', classes: 'bg-fuchsia-50 text-fuchsia-700' },
    COMPLETED: { label: 'Completed', classes: 'bg-green-50 text-green-700' },
    REJECTED: { label: 'Rejected', classes: 'bg-red-50 text-red-700' },
};

const STAGE_FILTERS = [
    { key: 'ALL', label: 'All Statuses' },
    { key: 'UNDER_ONBOARDING', label: 'Under Onboarding' },
    ...Object.entries(STAGE_INFO).map(([key, { label }]) => ({ key, label })),
];

export default function Astrologers() {
    const navigate = useNavigate();
    const [astrologers, setAstrologers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('ALL');

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

    const handleTogglePremium = async (item, newValue) => {
        setAstrologers(astrologers.map(a => a.id === item.id ? { ...a, profile: { ...a.profile, is_premium: newValue } } : a));
        try {
            await api.put(`/admin/astrologers/${item.id}/premium`, { is_premium: newValue });
        } catch (error) {
            console.error("Premium toggle failed", error);
            fetchAstrologers();
        }
    };

    const filteredAstrologers = astrologers.filter((item) => {
        const query = searchQuery.toLowerCase();
        const fullName = (item.profile?.full_name || '').toLowerCase();
        const bio = (item.profile?.short_bio || '').toLowerCase();
        const specialties = (item.profile?.specialties || '').toLowerCase();
        const email = (item.email || '').toLowerCase();
        const phone = (item.phone_number || '').toLowerCase();

        const matchesSearch = fullName.includes(query) ||
            bio.includes(query) ||
            specialties.includes(query) ||
            email.includes(query) ||
            phone.includes(query);

        const stage = item.profile?.onboarding_stage || 'APPLIED';
        const matchesStage = stageFilter === 'ALL'
            || (stageFilter === 'UNDER_ONBOARDING' ? !['COMPLETED', 'REJECTED'].includes(stage) : stage === stageFilter);

        return matchesSearch && matchesStage;
    });

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Astrologers</h1>
                    <p className="text-gray-900 mt-1">Manage your astrologer verification and profiles</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Search Field */}
                    <div className="relative flex-grow sm:w-80">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search name, phone, specialty..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E91E63] text-sm text-gray-900 shadow-sm"
                        />
                    </div>
                    {/* Onboarding Status Filter */}
                    <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E91E63] text-sm text-gray-900 shadow-sm bg-white"
                    >
                        {STAGE_FILTERS.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                    </select>
                    <Button onClick={() => navigate('/astrologers/add')} className="gap-2 shadow-sm whitespace-nowrap">
                        <Plus size={20} />
                        Add Astrologer
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAstrologers.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-4 flex flex-col justify-between group relative">
                        {/* Upper section: Avatar Left, Name & Info Right */}
                        <div className="flex gap-3 cursor-pointer" onClick={() => navigate(`/astrologers/view/${item.id}`)}>
                            <div className="relative flex-shrink-0">
                                <div className={`absolute inset-0 rounded-full blur-[1px] -m-0.5 bg-gradient-to-tr ${item.profile?.is_premium ? 'from-amber-400 to-orange-500' : 'from-indigo-300 to-pink-400 opacity-60'}`}></div>
                                <div className="relative rounded-full bg-white p-0.5">
                                    <Avatar
                                        src={item.profile?.profile_picture_url}
                                        className="w-12 h-12 shadow-sm"
                                        iconSize={24}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <h3 className="font-bold text-gray-900 truncate text-sm group-hover:text-[#E91E63] transition-colors">{item.profile?.full_name}</h3>
                                    {item.profile?.is_premium && (
                                        <Crown size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate mb-1">
                                    {item.profile?.specialties || 'Astrology'}
                                </p>
                                <p className="text-xs text-gray-900 line-clamp-1 mb-1">{item.profile?.short_bio || 'No bio provided'}</p>
                            </div>
                        </div>

                        {/* Mid Section: Badges & Premium Switch */}
                        <div className="flex items-center justify-between border-t border-gray-50 mt-3 pt-3">
                            <div className="flex gap-1.5">
                                <span className="px-2 py-0.5 bg-indigo-50/50 text-indigo-700 text-[10px] font-bold rounded">
                                    {item.profile?.experience_years}y exp
                                </span>
                                <span className="px-2 py-0.5 bg-rose-50/50 text-rose-700 text-[10px] font-bold rounded">
                                    ₹{item.profile?.consultation_fee_per_min}/m
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold text-gray-900">Premium</span>
                                <Switch
                                    checked={!!item.profile?.is_premium}
                                    onCheckedChange={(checked) => handleTogglePremium(item, checked)}
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* Footer Section: Onboarding Status / Active Switch & Action Buttons */}
                        <div className="flex justify-between items-center border-t border-gray-50 mt-3 pt-3">
                            {item.profile?.onboarding_stage === 'COMPLETED' ? (
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    <span className="text-[10px] font-bold text-gray-900">Active</span>
                                    <Switch
                                        checked={item.is_active !== false}
                                        onCheckedChange={(checked) => handleToggleStatus(item, checked)}
                                        size="sm"
                                    />
                                </div>
                            ) : (
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${STAGE_INFO[item.profile?.onboarding_stage]?.classes || 'bg-gray-100 text-gray-700'}`}>
                                    {STAGE_INFO[item.profile?.onboarding_stage]?.label || 'Applied'}
                                </span>
                            )}

                            <div className="flex gap-1.5">
                                <button
                                    className="bg-gray-50 text-gray-700 hover:bg-gray-100 text-[11px] font-semibold h-7 px-2.5 rounded transition-colors"
                                    onClick={() => navigate(`/astrologers/edit/${item.id}`)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-[11px] font-semibold h-7 px-2 rounded transition-colors"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
