import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Mail, Phone, Calendar, Clock, DollarSign, MessageCircle, Wifi, ThumbsDown, Repeat, Heart, CreditCard, Landmark, FileSignature, Award, ShieldCheck, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { Button, Avatar } from '../components/ui';
import clsx from 'clsx';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const resolveDocUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

function DocLink({ url, label }) {
    if (!url) return <span className="text-gray-400 text-xs">Not uploaded</span>;
    return (
        <a
            href={resolveDocUrl(url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
            <ExternalLink size={11} /> {label}
        </a>
    );
}

export default function AstrologerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [earnings, setEarnings] = useState({ total_earned: 0, monthly_earnings: [] });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [kycUpdating, setKycUpdating] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [profileRes, consultRes, earningsRes, statsRes] = await Promise.all([
                api.get('/admin/astrologers_full'),
                api.get(`/admin/astrologers/${id}/consultations`),
                api.get(`/admin/astrologers/${id}/earnings`),
                api.get(`/admin/astrologers/${id}/stats`)
            ]);

            const found = profileRes.data.astrologers.find(a => a.id === parseInt(id));
            setProfile(found);
            setConsultations(consultRes.data);
            setEarnings(earningsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch details", error);
            alert("Failed to load astrologer details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleKycVerify = async (verified) => {
        setKycUpdating(true);
        try {
            await api.put(`/admin/astrologers/${id}/kyc`, { kyc_verified: verified });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to update KYC verification status');
        } finally {
            setKycUpdating(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-900">Loading details...</div>;
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
                        <Avatar 
                            src={profile.profile?.profile_picture_url}
                            className="w-16 h-16 border-2 border-white shadow-sm" 
                            iconSize={32}
                            alt="Profile"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                {profile.profile.full_name}
                                {profile.profile.display_name && (
                                    <span
                                        title="Public nickname shown to seekers"
                                        className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full"
                                    >
                                        seen as: {profile.profile.display_name}
                                    </span>
                                )}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-gray-900 mt-1">
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
                        <h3 className="text-sm font-medium text-gray-900">Total Earnings</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{(earnings?.total_earned || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <MessageCircle size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Total Consultations</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{profile.profile.total_consultations || consultations.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Experience</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{profile.profile.experience_years} Years</p>
                </div>
            </div>

            {/* Monthly Earnings */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">Monthly Earnings</h3>
                </div>
                <div className="p-0">
                    {(!earnings?.monthly_earnings || earnings.monthly_earnings.length === 0) ? (
                        <p className="p-4 text-sm text-gray-900">No earnings yet.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-900 text-left">
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

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
                            <Wifi size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Avg Online Time (30d)</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.avg_online_hours_per_day_30d ?? 0} hrs/day</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <ThumbsDown size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Poor Chat %</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.poor_chat_percentage ?? 0}%</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Repeat size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">First User Repeat %</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.first_user_repeat_percentage ?? 0}%</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                            <Heart size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Loyal User %</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.loyal_user_percentage ?? 0}%</p>
                </div>
            </div>

            {/* About + KYC & Documents, side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">About</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {profile.profile.about_me || "No bio provided."}
                    </p>

                    <div className="mt-6 space-y-3">
                        <div className="text-sm">
                            <span className="text-gray-900 block text-xs uppercase tracking-wide">Languages</span>
                            <span className="font-medium text-gray-900">{profile.profile.languages}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-900 block text-xs uppercase tracking-wide">Specialties</span>
                            <span className="font-medium text-gray-900">{profile.profile.specialties}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <CreditCard size={16} className="text-indigo-600" /> KYC &amp; Documents
                            </h3>
                            {profile.profile.kyc_verified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                    <ShieldCheck size={11} /> Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200">
                                    Not Verified
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-xs text-gray-900">
                                <FileSignature size={14} className="text-gray-400 flex-shrink-0" />
                                {profile.profile.contract_signed_at ? (
                                    <span>Contract signed by <strong>{profile.profile.contract_signature_name}</strong> on {new Date(profile.profile.contract_signed_at).toLocaleDateString()}</span>
                                ) : (
                                    <span className="text-gray-400">Contract not signed yet</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                                <div>
                                    <span className="text-gray-900 text-xs uppercase tracking-wide block">PAN Number</span>
                                    <span className="font-medium text-gray-900 text-sm">{profile.profile.pan_number || '-'}</span>
                                    <div className="mt-0.5"><DocLink url={profile.profile.pan_doc_url} label="View PAN doc" /></div>
                                </div>
                                <div>
                                    <span className="text-gray-900 text-xs uppercase tracking-wide block">Aadhaar Number</span>
                                    <span className="font-medium text-gray-900 text-sm">{profile.profile.aadhaar_number || '-'}</span>
                                    <div className="mt-0.5"><DocLink url={profile.profile.aadhaar_doc_url} label="View Aadhaar doc" /></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                                <div>
                                    <span className="text-gray-900 text-xs uppercase tracking-wide flex items-center gap-1 mb-1">
                                        <Landmark size={12} /> Bank Details
                                    </span>
                                    <span className="text-gray-700 text-xs block">{profile.profile.bank_account_holder_name || '-'}</span>
                                    <span className="text-gray-700 text-xs block">Bank: {profile.profile.bank_name || '-'}</span>
                                    <span className="text-gray-700 text-xs block">A/C: {profile.profile.bank_account_number || '-'}</span>
                                    <span className="text-gray-700 text-xs block">IFSC: {profile.profile.bank_ifsc || '-'}</span>
                                    <span className="text-gray-700 text-xs block">Branch: {profile.profile.bank_address || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-900 text-xs uppercase tracking-wide flex items-center gap-1 mb-1">
                                        <Award size={12} /> Certificates
                                    </span>
                                    {profile.profile.certificate_urls?.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            {profile.profile.certificate_urls.map((url, i) => (
                                                <DocLink key={url} url={url} label={`Certificate ${i + 1}`} />
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs">None uploaded</span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-50">
                                <button
                                    onClick={() => handleKycVerify(!profile.profile.kyc_verified)}
                                    disabled={kycUpdating}
                                    className={clsx(
                                        "w-full text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50",
                                        profile.profile.kyc_verified
                                            ? "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200"
                                            : "bg-green-600 hover:bg-green-700 text-white"
                                    )}
                                >
                                    {kycUpdating ? 'Updating…' : profile.profile.kyc_verified ? 'Mark Unverified' : 'Mark KYC Verified'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Consultation History — last */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Consultation History</h3>
                    <span className="text-xs text-gray-900">Last 50 records</span>
                </div>
                <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-900 font-medium">
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
                                            <td colSpan="6" className="px-4 py-8 text-center text-gray-900">No consultations found.</td>
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
                                                    {c.seeker_name}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {Math.floor((c.duration_seconds || 0) / 60)}m {(c.duration_seconds || 0) % 60}s
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
