import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Mail, Phone, Calendar, Clock, DollarSign, MessageCircle } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui';

export default function AstrologerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [earnings, setEarnings] = useState({ total_earned: 0, monthly_earnings: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, consultRes, earningsRes] = await Promise.all([
                api.get('/admin/astrologers_full'),
                api.get(`/admin/astrologers/${id}/consultations`),
                api.get(`/admin/astrologers/${id}/earnings`)
            ]);

            const found = profileRes.data.astrologers.find(a => a.id === parseInt(id));
            setProfile(found);
            setConsultations(consultRes.data);
            setEarnings(earningsRes.data);
        } catch (error) {
            console.error("Failed to fetch details", error);
            alert("Failed to load astrologer details.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!profile) return <div className="p-8 text-center">Astrologer not found</div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/astrologers')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="flex items-center gap-4">
                        <img
                            src={profile.profile.profile_picture_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                            alt="Profile"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{profile.profile.full_name}</h1>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><Mail size={14} /> {profile.email}</span>
                                <span className="flex items-center gap-1"><Phone size={14} /> {profile.phone_number}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <Button onClick={() => navigate(`/astrologers/edit/${id}`)} className="gap-2">
                    <Edit2 size={16} /> Edit Profile
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{(earnings?.total_earned || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <MessageCircle size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Total Consultations</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{profile.profile.total_consultations || consultations.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Experience</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{profile.profile.experience_years} Years</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Earnings & Bio */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Earnings Summary */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Monthly Earnings</h3>
                        </div>
                        <div className="p-0">
                            {(!earnings?.monthly_earnings || earnings.monthly_earnings.length === 0) ? (
                                <p className="p-4 text-sm text-gray-500">No earnings yet.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500 text-left">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">Month</th>
                                            <th className="px-4 py-2 font-medium text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {earnings.monthly_earnings.map((m) => (
                                            <tr key={m.month}>
                                                <td className="px-4 py-2 text-gray-700">{m.month}</td>
                                                <td className="px-4 py-2 text-right font-medium text-emerald-600">₹{m.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">About</h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {profile.profile.about_me || "No bio provided."}
                        </p>

                        <div className="mt-6 space-y-3">
                            <div className="text-sm">
                                <span className="text-gray-500 block text-xs uppercase tracking-wide">Languages</span>
                                <span className="font-medium text-gray-900">{profile.profile.languages}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-gray-500 block text-xs uppercase tracking-wide">Specialties</span>
                                <span className="font-medium text-gray-900">{profile.profile.specialties}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Consultations */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Consultation History</h3>
                            <span className="text-xs text-gray-500">Last 50 records</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Seeker ID</th>
                                        <th className="px-4 py-3">Duration</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {consultations.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No consultations found.</td>
                                        </tr>
                                    ) : (
                                        consultations.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3 text-gray-600">
                                                    {new Date(c.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {c.consultation_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    #{c.seeker_id}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {Math.floor(c.duration_seconds / 60)}m {c.duration_seconds % 60}s
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    ₹{c.total_cost}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={c.status} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        COMPLETED: "bg-green-50 text-green-700 border-green-200",
        AUTO_ENDED: "bg-green-50 text-green-700 border-green-200",
        CANCELLED: "bg-red-50 text-red-700 border-red-200",
        REQUESTED: "bg-yellow-50 text-yellow-700 border-yellow-200",
        ONGOING: "bg-blue-50 text-blue-700 border-blue-200",
    };
    const defaultStyle = "bg-gray-50 text-gray-700 border-gray-200";

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || defaultStyle}`}>
            {status}
        </span>
    );
}
