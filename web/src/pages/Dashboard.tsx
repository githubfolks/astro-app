import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PaymentModal from '../components/PaymentModal';
import RatingModal from '../components/RatingModal';
import { Star, MessageCircle, Calendar, Clock, Wallet, Search, ChevronLeft, ChevronRight, User } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Astrologer specific state

    const [isOnline, setIsOnline] = useState(false);
    const [availabilityText, setAvailabilityText] = useState('');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            try {
                if (user?.role === 'ASTROLOGER') {
                    const data = await api.consultations.getHistory();
                    setHistory(data);

                    // Load own profile for settings
                    const profile = await api.astrologers.getProfile();

                    setIsOnline(profile.is_online);
                    setAvailabilityText(profile.availability_hours || '');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);



    const toggleOnlineStatus = async () => {
        try {
            setUpdatingProfile(true);
            const newStatus = !isOnline;
            await api.astrologers.updateProfile({ is_online: newStatus });
            setIsOnline(newStatus);
        } catch (e) {
            console.error(e);
            alert('Failed to update status');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const saveAvailability = async () => {
        try {
            setUpdatingProfile(true);
            await api.astrologers.updateProfile({ availability_hours: availabilityText });
            alert('Availability updated successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to update availability');
        } finally {
            setUpdatingProfile(false);
        }
    };

    if (user?.role === 'ASTROLOGER') {
        return (
            <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
                <Header />
                <main className="flex-1 container mx-auto p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Astrologer Dashboard</h2>
                            <p className="text-gray-600">Manage your status and consultations.</p>
                        </div>

                        {/* Status Toggle Card */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <span className="font-semibold text-gray-700">{isOnline ? 'You are Online' : 'You are Offline'}</span>
                            <button
                                onClick={toggleOnlineStatus}
                                disabled={updatingProfile}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isOnline
                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                            >
                                {isOnline ? 'Go Offline' : 'Go Online'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - Left Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Requests Queue Section */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="bg-[#E91E63] text-white p-1 rounded-md"><MessageCircle size={20} /></span>
                                    Requests Queue
                                    <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {history.filter((c: any) => ['REQUESTED', 'ACCEPTED', 'ACTIVE', 'ONGOING', 'PAUSED'].includes(c.status)).length}
                                    </span>
                                </h3>

                                {loading ? (
                                    <div className="flex justify-center p-10">
                                        <div className="animate-spin h-8 w-8 border-4 border-[#E91E63] rounded-full border-t-transparent"></div>
                                    </div>
                                ) : history.filter((c: any) => ['REQUESTED', 'ACCEPTED', 'ACTIVE', 'ONGOING', 'PAUSED'].includes(c.status)).length === 0 ? (
                                    <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                                        <p className="text-gray-500">No active requests in queue.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-0 overflow-hidden">
                                        <div className="grid gap-4 p-4">
                                            {history.filter((c: any) => ['REQUESTED', 'ACCEPTED', 'ACTIVE', 'ONGOING', 'PAUSED'].includes(c.status)).map((c: any) => (
                                                <div key={c.id} className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg overflow-hidden">
                                                            {c.seeker_profile?.profile_picture_url ? (
                                                                <img src={c.seeker_profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                                                            ) : (
                                                                c.seeker_profile?.full_name?.[0] || c.seeker_id
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900">{c.seeker_profile?.full_name || `User #${c.seeker_id}`}</h4>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                <Calendar size={12} />
                                                                {new Date(c.created_at).toLocaleString('en-IN', {
                                                                    day: '2-digit', month: 'short',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c.status === 'ACTIVE' || c.status === 'ONGOING' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                        <button
                                                            onClick={() => navigate(`/chat/${c.id}`)}
                                                            className="bg-[#E91E63] hover:bg-pink-700 text-white font-semibold text-sm px-6 py-2 rounded-lg transition-all shadow-md active:scale-95"
                                                        >
                                                            Open Chat
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Past History Section */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 text-gray-500">History</h3>
                                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Date</th>
                                                    <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">User</th>
                                                    <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Status</th>
                                                    <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider">Earnings</th>
                                                    <th className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {history.filter((c: any) => !['REQUESTED', 'ACCEPTED', 'ACTIVE', 'ONGOING', 'PAUSED'].includes(c.status)).map((c: any) => (
                                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-4 text-sm text-gray-500">
                                                            {new Date(c.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4 text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900">{c.seeker_profile?.full_name || `User #${c.seeker_id}`}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${c.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                'bg-gray-50 text-gray-700 border-gray-200'
                                                                }`}>
                                                                {c.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-mono font-bold text-gray-900">₹{c.total_cost || 0}</td>
                                                        <td className="p-4 text-right">
                                                            <button
                                                                onClick={() => navigate(`/chat/${c.id}`)}
                                                                className="text-gray-400 hover:text-[#E91E63] font-medium text-sm transition-colors"
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {history.filter((c: any) => !['REQUESTED', 'ACCEPTED', 'ACTIVE', 'ONGOING', 'PAUSED'].includes(c.status)).length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="p-8 text-center text-gray-400">
                                                            <p>No past consultations.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Availability Settings */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Clock size={20} className="text-[#E91E63]" />
                                    Availability Settings
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                                        <div className={`p-3 rounded-lg border flex items-center gap-3 ${isOnline ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                            <span className={`font-bold ${isOnline ? 'text-green-700' : 'text-gray-600'}`}>
                                                {isOnline ? 'Online - Receiving Calls' : 'Offline - Not Visible'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Availability Hours</label>
                                        <textarea
                                            value={availabilityText}
                                            onChange={(e) => setAvailabilityText(e.target.value)}
                                            placeholder="e.g. Mon-Fri: 2pm - 6pm"
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                                            rows={3}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Seekers will see this text on your profile.</p>
                                    </div>

                                    <button
                                        onClick={saveAvailability}
                                        disabled={updatingProfile}
                                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        Update Availability Limit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }
    // Seeker Dashboard
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [seekerHistory, setSeekerHistory] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingConsultation, setRatingConsultation] = useState<any>(null);

    // Search and Pagination for Seeker
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Seeker Profile
    const [seekerProfile, setSeekerProfile] = useState<any>({});
    const [profileSaving, setProfileSaving] = useState(false);

    useEffect(() => {
        if (user?.role === 'SEEKER') {
            // Load wallet balance
            api.wallet.getBalance().then(w => setWalletBalance(Number(w.balance))).catch(console.error);
            // Load consultation history
            api.consultations.getHistory().then(data => setSeekerHistory(data)).catch(console.error);
            // Load seeker profile
            api.seekers.getProfile().then(setSeekerProfile).catch(console.error);
        }
    }, [user]);

    const handlePaymentSuccess = async (amount: number) => {
        try {
            await api.wallet.addMoney(amount);
            const w = await api.wallet.getBalance();
            setWalletBalance(Number(w.balance));
        } catch (e) {
            console.error(e);
        }
        setShowPaymentModal(false);
    };

    const openRating = (consultation: any) => {
        setRatingConsultation(consultation);
        setShowRatingModal(true);
    };

    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!ratingConsultation) return;
        try {
            await api.consultations.submitReview(ratingConsultation.id, rating, comment);
            // Refresh history to update rating display
            const data = await api.consultations.getHistory();
            setSeekerHistory(data);
        } catch (e) {
            console.error(e);
        }
        setShowRatingModal(false);
        setRatingConsultation(null);
    };

    const handleProfileSave = async () => {
        setProfileSaving(true);
        try {
            await api.seekers.updateProfile(seekerProfile);
            alert('Profile updated successfully!');
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Failed to save profile');
        }
        setProfileSaving(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <Header />
            <main className="flex-1 container mx-auto p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Past Consultations */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageCircle className="text-[#E91E63]" size={24} />
                                My Consultations
                                <span className="text-sm font-normal text-gray-500">({seekerHistory.length})</span>
                            </h3>

                            {/* Search Box */}
                            {seekerHistory.length > 0 && (
                                <div className="mb-4 relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by astrologer name..."
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                    />
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center p-10">
                                    <div className="animate-spin h-8 w-8 border-4 border-[#E91E63] rounded-full border-t-transparent"></div>
                                </div>
                            ) : seekerHistory.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                                    <p className="text-gray-500 mb-4">No consultations yet.</p>
                                    <button
                                        onClick={() => navigate('/chat-with-astrologers')}
                                        className="bg-[#E91E63] text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-700"
                                    >
                                        Find an Astrologer
                                    </button>
                                </div>
                            ) : (() => {
                                // Filter by search
                                const filtered = seekerHistory.filter((c: any) => {
                                    const name = c.astrologer_profile?.full_name?.toLowerCase() || '';
                                    return name.includes(searchQuery.toLowerCase());
                                });

                                // Pagination
                                const totalPages = Math.ceil(filtered.length / itemsPerPage);
                                const startIdx = (currentPage - 1) * itemsPerPage;
                                const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage);

                                if (filtered.length === 0) {
                                    return (
                                        <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                                            <p className="text-gray-500">No consultations match your search.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <div className="grid gap-4">
                                            {paginatedData.map((c: any) => (
                                                <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all">
                                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
                                                                {c.astrologer_profile?.full_name?.[0] || 'A'}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900">{c.astrologer_profile?.full_name || `Astrologer #${c.astrologer_id}`}</h4>
                                                                <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar size={14} />
                                                                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={14} />
                                                                        {Math.round((c.duration_seconds || 0) / 60)} mins
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2">
                                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                                        c.status === 'ACTIVE' || c.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-gray-100 text-gray-600'
                                                                        }`}>
                                                                        {c.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-end justify-between">
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-gray-900">₹{Number(c.total_cost || 0).toFixed(2)}</div>
                                                                <div className="text-xs text-gray-500">@₹{Number(c.rate_per_min || 0)}/min</div>
                                                            </div>

                                                            {c.status === 'COMPLETED' && (
                                                                <div className="mt-2">
                                                                    {c.review ? (
                                                                        <div className="flex items-center gap-1 text-yellow-600">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <Star key={i} size={16} fill={i < (c.review?.rating || 0) ? 'currentColor' : 'none'} />
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => openRating(c)}
                                                                            className="text-sm text-[#E91E63] font-semibold hover:underline"
                                                                        >
                                                                            Rate Now
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center gap-2 mt-6">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                                <span className="text-sm text-gray-600 px-3">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Sidebar - Wallet & Profile */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Wallet className="text-[#E91E63]" size={20} />
                                My Wallet
                            </h3>

                            <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] rounded-xl p-6 text-white mb-4">
                                <div className="text-sm opacity-80 mb-1">Available Balance</div>
                                <div className="text-3xl font-bold">₹{walletBalance.toFixed(2)}</div>
                            </div>

                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                + Add Money
                            </button>

                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => navigate('/chat-with-astrologers')}
                                    className="w-full bg-[#E91E63] text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <MessageCircle size={18} />
                                    Talk to Astrologer
                                </button>
                            </div>
                        </div>

                        {/* My Profile Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="text-[#E91E63]" size={20} />
                                My Profile
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={seekerProfile.full_name || ''}
                                        onChange={(e) => setSeekerProfile({ ...seekerProfile, full_name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={seekerProfile.date_of_birth || ''}
                                            onChange={(e) => setSeekerProfile({ ...seekerProfile, date_of_birth: e.target.value })}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Time of Birth</label>
                                        <input
                                            type="time"
                                            value={seekerProfile.time_of_birth || ''}
                                            onChange={(e) => setSeekerProfile({ ...seekerProfile, time_of_birth: e.target.value })}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Place of Birth</label>
                                    <input
                                        type="text"
                                        value={seekerProfile.place_of_birth || ''}
                                        onChange={(e) => setSeekerProfile({ ...seekerProfile, place_of_birth: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                        placeholder="City, Country"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Gender</label>
                                    <select
                                        value={seekerProfile.gender || ''}
                                        onChange={(e) => setSeekerProfile({ ...seekerProfile, gender: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleProfileSave}
                                    disabled={profileSaving}
                                    className="w-full bg-[#E91E63] text-white font-bold py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                                >
                                    {profileSaving ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
            />

            {/* Rating Modal */}
            <RatingModal
                isOpen={showRatingModal}
                astrologerName={ratingConsultation?.astrologer_profile?.full_name || `Astrologer`}
                onSubmit={handleReviewSubmit}
                onSkip={() => { setShowRatingModal(false); setRatingConsultation(null); }}
            />
        </div>
    );
};
