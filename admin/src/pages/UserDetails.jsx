import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, MessageSquare, IndianRupee, User, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui';

export default function UserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [userRes, consultRes] = await Promise.all([
                api.get(`/admin/users/${id}/details`),
                api.get(`/admin/users/${id}/consultations`)
            ]);
            setData(userRes.data);
            setConsultations(consultRes.data);
        } catch (error) {
            console.error("Failed to fetch user details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!data) return <div className="p-8 text-center">User not found</div>;

    const { user, profile, wallet_balance, stats } = data;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/users')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                            {profile.profile_picture_url ? (
                                <img src={profile.profile_picture_url} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <User className="text-gray-400" size={32} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                {profile.full_name || user.email || "Unknown User"}
                                {user.is_verified ? <CheckCircle size={18} className="text-blue-500" /> : <XCircle size={18} className="text-gray-300" />}
                            </h1>
                            <div className="flex flex-col text-sm text-gray-500 mt-1">
                                <span>ID: #{user.id} • {user.role}</span>
                                <span>{user.email} • {user.phone_number}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Wallet Balance</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{parseFloat(wallet_balance).toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <IndianRupee size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{parseFloat(stats.total_spent).toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <MessageSquare size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Total Consultations</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_consultations}</p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-50">Profile Details</h3>

                        <div className="space-y-4">
                            <div>
                                <span className="text-gray-500 text-xs uppercase tracking-wide block">Full Name</span>
                                <span className="font-medium text-gray-900">{profile.full_name || "-"}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs uppercase tracking-wide block">Date of Birth</span>
                                <span className="font-medium text-gray-900">{profile.date_of_birth || "-"}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs uppercase tracking-wide block">Place of Birth</span>
                                <span className="font-medium text-gray-900">{profile.place_of_birth || "-"}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs uppercase tracking-wide block">Gender</span>
                                <span className="font-medium text-gray-900">{profile.gender || "-"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Consultations */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Consultation History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Astrologer ID</th>
                                        <th className="px-4 py-3">Duration</th>
                                        <th className="px-4 py-3">Cost</th>
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
                                                    #{c.astrologer_id}
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
