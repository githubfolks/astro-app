import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, MessageSquare, IndianRupee, User, CheckCircle, XCircle, Key } from 'lucide-react';
import api from '../services/api';
import { Button, Avatar } from '../components/ui';
import clsx from 'clsx';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { EditUserModal } from '../components/EditUserModal';

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
                            </h1>
                            <div className="flex flex-col text-sm text-gray-500 mt-1">
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
                            <h3 className="text-sm font-medium text-gray-500">Wallet Balance</h3>
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

                            {user?.role === 'SEEKER' && (
                                <>
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase tracking-wide block">Date of Birth</span>
                                        <span className="font-medium text-gray-900">{profile.date_of_birth || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase tracking-wide block">Time of Birth</span>
                                        <span className="font-medium text-gray-900">{profile.time_of_birth || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase tracking-wide block">Place of Birth</span>
                                        <span className="font-medium text-gray-900">{profile.place_of_birth || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase tracking-wide block">Gender</span>
                                        <span className="font-medium text-gray-900">{profile.gender || "-"}</span>
                                    </div>
                                </>
                            )}

                            {user?.role === 'ASTROLOGER' && (
                                <>
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase tracking-wide block">Experience (Years)</span>
                                        <span className="font-medium text-gray-900">{profile.experience_years !== undefined ? `${profile.experience_years} years` : "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase tracking-wide block">Languages</span>
                                        <span className="font-medium text-gray-900">{profile.languages || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs uppercase tracking-wide block">Specialties</span>
                                        <span className="font-medium text-gray-900">{profile.specialties || "-"}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: consultations and wallet */}
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
                                <thead className="bg-gray-50 text-gray-500 font-medium">
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
                                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No transactions found.</td>
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
                                                <td className="px-4 py-3 text-gray-500">
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
                        <p className="text-sm text-gray-500">Use a positive number to credit, negative to debit.</p>
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
