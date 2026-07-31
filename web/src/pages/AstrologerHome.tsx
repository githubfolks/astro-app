import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Star } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useRealtime } from '../context/RealtimeContext';
import { api } from '../services/api';
import { resolveImageUrl } from '../utils/url';
import { isNative } from '../utils/platform';
import type { Consultation, AstrologerProfile as AstrologerProfileType, ProfileSummary, PerformanceStats } from '../types';

interface RepeatSeeker {
    seekerId: number;
    profile: ProfileSummary | null | undefined;
    count: number;
    totalEarning: number;
    lastChatDate: string;
}

const ACTIVE_STATUSES = ['ACCEPTED', 'ACTIVE', 'ONGOING', 'PAUSED'];
const QUEUE_STATUSES = ['REQUESTED', ...ACTIVE_STATUSES];

// Condensed Home tab for astrologers: today's actionable snapshot, with a clear
// door to the full Dashboard for history/payouts/stats. Astrologers previously
// saw the seeker marketing page (MobileHome) here, which had nothing for them.
const AstrologerHome: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<Consultation[]>([]);
    const [profile, setProfile] = useState<AstrologerProfileType | null>(null);
    const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [historyData, profileData] = await Promise.all([
                    api.consultations.getHistory(),
                    api.astrologers.getProfile(),
                ]);
                setHistory(historyData);
                setProfile(profileData);
                setIsOnline(profileData.is_online);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
            // Weekly-cadence stats — fetched separately so a slow/failed call here
            // never blocks the actionable content above from rendering.
            api.astrologers.getPerformanceStats().then(setPerformanceStats).catch(console.error);
        };
        load();
    }, []);

    useRealtime((event) => {
        if (['NEW_REQUEST', 'QUEUE_UPDATE'].includes(event.type)) {
            api.consultations.getHistory().then(setHistory).catch(console.error);
        }
    });

    const toggleOnline = async () => {
        try {
            setUpdating(true);
            const next = !isOnline;
            await api.astrologers.updateProfile({ is_online: next });
            setIsOnline(next);
        } catch (e) {
            console.error(e);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const queue = history.filter((c) => QUEUE_STATUSES.includes(c.status));
    const activeSession = queue.find((c) => ACTIVE_STATUSES.includes(c.status));
    const hasActiveSession = !!activeSession;
    const topRequests = queue.slice(0, 2);

    const todayStr = new Date().toDateString();
    const todayConsults = history.filter((c) =>
        ['COMPLETED', 'AUTO_ENDED'].includes(c.status) && new Date(c.created_at).toDateString() === todayStr
    );
    const earnedToday = todayConsults.reduce((sum, c) => sum + Number(c.total_cost || 0), 0);

    // Seekers who've booked this astrologer more than once, most recent chat first.
    const repeatSeekersMap = new Map<number, RepeatSeeker>();
    for (const c of history) {
        if (!c.seeker_id || !['COMPLETED', 'AUTO_ENDED'].includes(c.status)) continue;
        const cost = Number(c.total_cost || 0);
        const existing = repeatSeekersMap.get(c.seeker_id);
        if (existing) {
            existing.count += 1;
            existing.totalEarning += cost;
            if (new Date(c.created_at) > new Date(existing.lastChatDate)) {
                existing.lastChatDate = c.created_at;
                existing.profile = c.seeker_profile;
            }
        } else {
            repeatSeekersMap.set(c.seeker_id, {
                seekerId: c.seeker_id,
                profile: c.seeker_profile,
                count: 1,
                totalEarning: cost,
                lastChatDate: c.created_at,
            });
        }
    }
    const repeatSeekers = Array.from(repeatSeekersMap.values())
        .filter((s) => s.count > 1)
        .sort((a, b) => new Date(b.lastChatDate).getTime() - new Date(a.lastChatDate).getTime())
        .slice(0, 5);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E91E63]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0] pb-24 md:pb-0">
            <Header />
            <main className="flex-1 container mx-auto p-4 md:p-8 max-w-5xl">
              {activeSession && (
                  <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] text-white rounded-2xl shadow-lg p-4 flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="animate-pulse" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm leading-tight">Ongoing consultation</p>
                          <p className="text-xs text-white/90 truncate">
                              {activeSession.seeker_profile?.full_name || 'Seeker'} · resume when ready
                          </p>
                      </div>
                      <button
                          onClick={() => navigate(`/chat/${activeSession.id}`)}
                          className="bg-white text-[#E91E63] px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap active:scale-95 transition-all"
                      >
                          Resume →
                      </button>
                  </div>
              )}

              <div className="flex flex-col items-center text-center gap-1 pt-1 mb-4">
                  <img
                      src={resolveImageUrl(profile?.profile_picture_url, profile?.full_name)}
                      alt={profile?.full_name || 'Profile'}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <h2 className="text-lg font-bold text-gray-900 mt-1">{profile?.full_name || 'Astrologer'}</h2>
                  {profile?.display_name && (
                      <p className="text-sm font-semibold text-[#E91E63]">"{profile.display_name}"</p>
                  )}
                  <p className="text-xs text-gray-500">Here's how today looks</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{isOnline ? "You're Online" : "You're Offline"}</p>
                        <p className="text-xs text-gray-500">{isOnline ? 'Seekers can reach you now' : 'Go online to receive requests'}</p>
                    </div>
                    <button
                        onClick={toggleOnline}
                        disabled={updating}
                        className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors flex-shrink-0 ${isOnline ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-500 text-white hover:bg-green-600'}`}
                    >
                        {isOnline ? 'Go Offline' : 'Go Online'}
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Today</span>
                        <span className="text-xs text-gray-400">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-gray-100">
                        <div className="text-center">
                            <p className="text-lg font-extrabold text-[#E91E63] font-mono">₹{earnedToday.toFixed(0)}</p>
                            <p className="text-[10px] text-gray-400 uppercase">Earned</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-extrabold text-gray-900 font-mono">{todayConsults.length}</p>
                            <p className="text-[10px] text-gray-400 uppercase">Chats</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-extrabold text-gray-900 font-mono flex items-center justify-center gap-1">
                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                {profile?.rating_avg ? Number(profile.rating_avg).toFixed(1) : '—'}
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase">Rating</p>
                        </div>
                    </div>
                </div>
                </div>

                <div>
                    <div className="flex items-center justify-between px-1 mb-2">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Requests Queue</span>
                        {queue.length > 0 && (
                            <span className="bg-[#E91E63] text-white text-[11px] font-bold rounded-full px-2 py-0.5">{queue.length}</span>
                        )}
                    </div>
                    {topRequests.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-400">
                            No pending requests right now.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topRequests.map((c) => {
                                const isThisActive = ACTIVE_STATUSES.includes(c.status);
                                const blocked = !isThisActive && hasActiveSession;
                                return (
                                    <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
                                        <img
                                            src={resolveImageUrl(c.seeker_profile?.profile_picture_url, c.seeker_profile?.full_name || String(c.seeker_id))}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 text-sm truncate">{c.seeker_profile?.full_name || `User #${c.seeker_id}`}</p>
                                            {isThisActive ? (
                                                <span className="text-[10px] text-green-700 font-bold bg-green-50 border border-green-200 rounded-full px-2 py-0.5">{c.status}</span>
                                            ) : (
                                                <span className="text-[10px] text-yellow-700 font-bold bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5">Waiting</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => navigate(`/chat/${c.id}`)}
                                            disabled={blocked}
                                            title={blocked ? 'Finish your current chat first' : 'Open Chat'}
                                            aria-label="Open Chat"
                                            className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 ${blocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#E91E63] text-white hover:bg-pink-700'}`}
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                            {queue.length > topRequests.length && (
                                <button onClick={() => navigate('/dashboard')} className="w-full text-center text-xs font-semibold text-[#E91E63] py-1">
                                    View all requests ({queue.length}) →
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider px-1">Repeat Seekers</span>
                    {repeatSeekers.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-sm text-gray-400 mt-2">
                            No repeat seekers yet.
                        </div>
                    ) : (
                        <div className="space-y-2 mt-2">
                            {repeatSeekers.map((s) => (
                                <div key={s.seekerId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
                                    <img
                                        src={resolveImageUrl(s.profile?.profile_picture_url, s.profile?.full_name || String(s.seekerId))}
                                        alt="Profile"
                                        className="w-11 h-11 rounded-full object-cover border border-gray-100 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">{s.profile?.full_name || `User #${s.seekerId}`}</p>
                                        <p className="text-[11px] text-gray-500">
                                            {s.count} chats · Last {new Date(s.lastChatDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                    <p className="text-sm font-extrabold text-[#E91E63] font-mono flex-shrink-0">₹{s.totalEarning.toFixed(0)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </div>

                <div className="space-y-4">
                    {performanceStats && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <div className="grid grid-cols-4 gap-2 divide-x divide-gray-100">
                                <div className="flex flex-col items-center text-center px-1">
                                    <p className="text-lg font-extrabold text-cyan-600">{performanceStats.avg_online_hours_per_day_30d}h</p>
                                    <h3 className="text-[11px] text-gray-500 leading-tight mt-1">Online Time</h3>
                                </div>
                                <div className="flex flex-col items-center text-center px-1">
                                    <p className="text-lg font-extrabold text-red-500">{performanceStats.poor_chat_percentage}%</p>
                                    <h3 className="text-[11px] text-gray-500 leading-tight mt-1">Poor Chat<br />Percent</h3>
                                </div>
                                <div className="flex flex-col items-center text-center px-1">
                                    <p className="text-lg font-extrabold text-indigo-600">{performanceStats.first_user_repeat_percentage}%</p>
                                    <h3 className="text-[11px] text-gray-500 leading-tight mt-1">First User<br />Repeat</h3>
                                </div>
                                <div className="flex flex-col items-center text-center px-1">
                                    <p className="text-lg font-extrabold text-pink-600">{performanceStats.loyal_user_percentage}%</p>
                                    <h3 className="text-[11px] text-gray-500 leading-tight mt-1">Loyal User<br />Percent</h3>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              </div>
            </main>
            {!isNative() && <Footer />}
        </div>
    );
};

export default AstrologerHome;
