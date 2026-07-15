import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, MessageSquare, IndianRupee, User, CheckCircle, XCircle, Key, CreditCard, Landmark, FileSignature, Award, ShieldCheck, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { Button, Avatar } from '../components/ui';
import clsx from 'clsx';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { EditUserModal } from '../components/EditUserModal';

// Mirrors the STAGES list in AstrologerOnboarding.jsx / Astrologers.jsx so the
// badge shown here matches the Kanban column the astrologer currently sits in.
const STAGE_INFO = {
    APPLIED: { label: 'Applied', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
    INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
    PROFILE_ACTIVATED: { label: 'Profile Activated', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    ONBOARDING_INTIMATED: { label: 'Onboarding Intimated', classes: 'bg-violet-50 text-violet-700 border-violet-200' },
    ONBOARDING_STARTED: { label: 'Onboarding Started', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
    TRAINING_SCHEDULED: { label: 'Training Scheduled', classes: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
    COMPLETED: { label: 'Completed', classes: 'bg-green-50 text-green-700 border-green-200' },
    REJECTED: { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200' },
};

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

export default function UserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [walletModal, setWalletModal] = useState(false);
    const [walletAmount, setWalletAmount] = useState('');
    const [walletDesc, setWalletDesc] = useState('Admin adjustment');
    const [walletLoading, setWalletLoading] = useState(false);
    const [kycUpdating, setKycUpdating] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [userRes, consultRes, transRes] = await Promise.all([
                api.get(`/admin/users/${id}/details`),
                api.get(`/admin/users/${id}/consultations`),
                api.get(`/admin/users/${id}/wallet-history`)
            ]);
            setData(userRes.data);
            setConsultations(consultRes.data);
            setTransactions(transRes.data);
        } catch (error) {
            console.error("Failed to fetch user details", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleResetPassword = () => {
        setIsResetModalOpen(true);
    };

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

    const handleWalletAdjust = async () => {
        const amount = parseFloat(walletAmount);
        if (isNaN(amount) || amount === 0) { alert('Enter a valid non-zero amount'); return; }
        setWalletLoading(true);
        try {
            await api.post(`/admin/users/${id}/wallet/credit`, { amount, description: walletDesc });
            alert('Wallet adjusted successfully!');
            setWalletModal(false);
            setWalletAmount('');
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to adjust wallet');
        } finally {
            setWalletLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-900">Loading details...</div>;
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
                        <Avatar 
                            src={profile.profile_picture_url} 
                            className="w-16 h-16 border-2 border-white shadow-sm" 
                            iconSize={32}
                            alt="Profile"
                        />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                {profile.full_name || user.email || "Unknown User"}
                                {user.is_verified ? <CheckCircle size={18} className="text-blue-500" /> : <XCircle size={18} className="text-gray-300" />}
                                {user.role === 'ASTROLOGER' && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STAGE_INFO[profile.onboarding_stage]?.classes || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                        {STAGE_INFO[profile.onboarding_stage]?.label || 'Applied'}
                                    </span>
                                )}
                            </h1>
                            <div className="flex flex-col text-sm text-gray-900 mt-1">
                                <span>ID: #{user.id} • {user.role}</span>
                                <span>{user.email} • {user.phone_number}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outlined" onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2">
                        <User size={18} className="text-indigo-600" /> Edit Details
                    </Button>
                    <Button variant="outlined" onClick={handleResetPassword} className="flex items-center gap-2">
                        <Key size={18} className="text-amber-600" /> Reset Password
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Wallet size={20} />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">Wallet Balance</h3>
                        </div>
                        <button onClick={() => setWalletModal(true)} className="text-xs text-purple-600 hover:underline font-medium">Adjust</button>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{parseFloat(wallet_balance).toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <IndianRupee size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Total Spent</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{parseFloat(stats.total_spent).toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <MessageSquare size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Total Consultations</h3>
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
                                <span className="text-gray-900 text-xs uppercase tracking-wide block">Full Name</span>
                                <span className="font-medium text-gray-900">{profile.full_name || "-"}</span>
                            </div>

                            {user?.role === 'SEEKER' && (
                                <>
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide block">Date of Birth</span>
                                        <span className="font-medium text-gray-900">{profile.date_of_birth || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide block">Time of Birth</span>
                                        <span className="font-medium text-gray-900">{profile.time_of_birth || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide block">Place of Birth</span>
                                        <span className="font-medium text-gray-900">{profile.place_of_birth || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide block">Gender</span>
                                        <span className="font-medium text-gray-900">{profile.gender || "-"}</span>
                                    </div>
                                </>
                            )}

                            {user?.role === 'ASTROLOGER' && (
                                <>
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide block">Experience (Years)</span>
                                        <span className="font-medium text-gray-900">{profile.experience_years !== undefined ? `${profile.experience_years} years` : "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide block">Languages</span>
                                        <span className="font-medium text-gray-900">{profile.languages || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide block">Specialties</span>
                                        <span className="font-medium text-gray-900">{profile.specialties || "-"}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {user?.role === 'ASTROLOGER' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <CreditCard size={16} className="text-indigo-600" /> KYC &amp; Documents
                                </h3>
                                {profile.kyc_verified ? (
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
                                    {profile.contract_signed_at ? (
                                        <span>Contract signed by <strong>{profile.contract_signature_name}</strong> on {new Date(profile.contract_signed_at).toLocaleDateString()}</span>
                                    ) : (
                                        <span className="text-gray-400">Contract not signed yet</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide block">PAN Number</span>
                                        <span className="font-medium text-gray-900 text-sm">{profile.pan_number || '-'}</span>
                                        <div className="mt-0.5"><DocLink url={profile.pan_doc_url} label="View PAN doc" /></div>
                                    </div>
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide block">Aadhaar Number</span>
                                        <span className="font-medium text-gray-900 text-sm">{profile.aadhaar_number || '-'}</span>
                                        <div className="mt-0.5"><DocLink url={profile.aadhaar_doc_url} label="View Aadhaar doc" /></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide flex items-center gap-1 mb-1">
                                            <Landmark size={12} /> Bank Details
                                        </span>
                                        <span className="text-gray-700 text-xs block">{profile.bank_account_holder_name || '-'}</span>
                                        <span className="text-gray-700 text-xs block">Bank: {profile.bank_name || '-'}</span>
                                        <span className="text-gray-700 text-xs block">A/C: {profile.bank_account_number || '-'}</span>
                                        <span className="text-gray-700 text-xs block">IFSC: {profile.bank_ifsc || '-'}</span>
                                        <span className="text-gray-700 text-xs block">Branch: {profile.bank_address || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-900 text-xs uppercase tracking-wide flex items-center gap-1 mb-1">
                                            <Award size={12} /> Certificates
                                        </span>
                                        {profile.certificate_urls?.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {profile.certificate_urls.map((url, i) => (
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
                                        onClick={() => handleKycVerify(!profile.kyc_verified)}
                                        disabled={kycUpdating}
                                        className={clsx(
                                            "w-full text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50",
                                            profile.kyc_verified
                                                ? "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200"
                                                : "bg-green-600 hover:bg-green-700 text-white"
                                        )}
                                    >
                                        {kycUpdating ? 'Updating…' : profile.kyc_verified ? 'Mark Unverified' : 'Mark KYC Verified'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: consultations and wallet */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Consultation History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-900 font-medium">
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
                                                    {c.astrologer_name}
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

                    {/* Wallet History Card */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Wallet Transaction History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-900 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Reference/Description</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-gray-900">No transactions found.</td>
                                        </tr>
                                    ) : (
                                        transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3 text-gray-600">
                                                    {new Date(t.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <TransactionBadge type={t.transaction_type} />
                                                </td>
                                                <td className="px-4 py-3 text-gray-900">
                                                    <div className="text-xs font-medium text-gray-700">{t.reference_id || "-"}</div>
                                                    <div className="text-[10px] text-gray-400 max-w-[250px] truncate" title={t.description}>{t.description}</div>
                                                </td>
                                                <td className={clsx(
                                                    "px-4 py-3 text-right font-medium",
                                                    parseFloat(t.amount) > 0 ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {parseFloat(t.amount) > 0 ? "+" : ""}₹{Math.abs(parseFloat(t.amount)).toFixed(2)}
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

            <ResetPasswordModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                userId={id}
                userEmail={user?.email}
            />

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
                profile={profile}
                onSuccess={fetchData}
            />

            {walletModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
                        <h2 className="text-lg font-bold text-gray-900">Adjust Wallet Balance</h2>
                        <p className="text-sm text-gray-900">Use a positive number to credit, negative to debit.</p>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                            <input
                                type="number"
                                value={walletAmount}
                                onChange={e => setWalletAmount(e.target.value)}
                                placeholder="e.g. 100 or -50"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                            <input
                                type="text"
                                value={walletDesc}
                                onChange={e => setWalletDesc(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleWalletAdjust}
                                disabled={walletLoading}
                                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60"
                            >
                                {walletLoading ? 'Processing...' : 'Apply'}
                            </button>
                            <button
                                onClick={() => { setWalletModal(false); setWalletAmount(''); }}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
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

function TransactionBadge({ type }) {
    const styles = {
        DEPOSIT: "bg-green-50 text-green-700 border-green-200",
        PAYMENT_GATEWAY: "bg-green-50 text-green-700 border-green-200",
        CHAT_REFUND: "bg-green-50 text-green-700 border-green-200",
        WITHDRAWAL: "bg-red-50 text-red-700 border-red-200",
        CHAT_DEDUCTION: "bg-red-50 text-red-700 border-red-200",
        COURSE_PURCHASE: "bg-orange-50 text-orange-700 border-orange-200",
    };
    const defaultStyle = "bg-gray-50 text-gray-700 border-gray-200";

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase ${styles[type] || defaultStyle}`}>
            {type.replace(/_/g, ' ')}
        </span>
    );
}
