import React, { useState, useEffect } from 'react';
import { Star, X, Clock, MessageSquare, Heart } from 'lucide-react';
import type { Consultation, ChatHistoryItem, ChartData, MatchData } from '../types';
import { api } from '../services/api';
import { KundliContent } from './KundliPanel';
import { MatchContent } from './MatchPanel';

interface Props {
    consultation: Consultation | null;
    onClose: () => void;
}

const formatDuration = (totalSeconds?: number) => {
    const secs = totalSeconds || 0;
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}m ${seconds}s`;
};

const ConsultationDetailModal: React.FC<Props> = ({ consultation, onClose }) => {
    const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    type TabType = 'transcript' | 'details' | 'kundli' | 'compatibility';
    const [activeTab, setActiveTab] = useState<TabType>('transcript');

    const [kundliData, setKundliData] = useState<ChartData | null>(null);
    const [kundliLoading, setKundliLoading] = useState(false);
    const [kundliError, setKundliError] = useState<string | null>(null);

    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const [matchLoading, setMatchLoading] = useState(false);
    const [matchError, setMatchError] = useState<string | null>(null);

    useEffect(() => {
        if (consultation) {
            setLoading(true);
            setMessages([]);
            setActiveTab('transcript');
            api.consultations.getChatHistory(consultation.id)
                .then((data: ChatHistoryItem[]) => {
                    setMessages(data);
                    setLoading(false);
                })
                .catch((err: unknown) => {
                    console.error('Failed to load chat history', err);
                    setLoading(false);
                });
        }
    }, [consultation]);

    const handleTabKundli = async () => {
        setActiveTab('kundli');
        if (kundliData || kundliLoading) return;
        if (!consultation?.seeker_profile?.date_of_birth) {
            setKundliError('Birth details not available');
            return;
        }
        setKundliLoading(true);
        try {
            const data = await api.kundli.generate({
                seeker_id: consultation.seeker_id || 0,
                full_name: consultation.seeker_profile.full_name || 'Seeker',
                date_of_birth: consultation.seeker_profile.date_of_birth,
                time_of_birth: consultation.seeker_profile.time_of_birth || '12:00:00',
                place_of_birth: consultation.seeker_profile.place_of_birth || 'New Delhi, Delhi, India',
            });
            setKundliData(data.chart_data);
        } catch (e) {
            setKundliError('Failed to generate Kundli');
        } finally {
            setKundliLoading(false);
        }
    };

    const handleTabCompatibility = async () => {
        setActiveTab('compatibility');
        if (matchData || matchLoading) return;
        if (!consultation?.seeker_profile?.date_of_birth || !consultation.spouse_date_of_birth) {
            setMatchError('Both seeker and spouse birth details are required.');
            return;
        }
        setMatchLoading(true);
        try {
            const seeker = {
                seeker_id: consultation.seeker_id || 0,
                full_name: consultation.seeker_profile.full_name || 'Seeker',
                date_of_birth: consultation.seeker_profile.date_of_birth,
                time_of_birth: consultation.seeker_profile.time_of_birth || '12:00:00',
                place_of_birth: consultation.seeker_profile.place_of_birth || 'New Delhi, Delhi, India',
            };
            const spouse = {
                seeker_id: 0,
                full_name: consultation.spouse_name || 'Spouse',
                date_of_birth: consultation.spouse_date_of_birth,
                time_of_birth: consultation.spouse_time_of_birth || '12:00:00',
                place_of_birth: consultation.spouse_place_of_birth || 'New Delhi, Delhi, India',
            };

            const isSeekerMale = consultation.seeker_profile?.gender === 'MALE';
            const boy = isSeekerMale ? seeker : spouse;
            const girl = isSeekerMale ? spouse : seeker;

            const res = await api.matching.generate({ boy, girl });
            setMatchData(res.match_data);
        } catch (e) {
            setMatchError('Failed to generate compatibility report');
        } finally {
            setMatchLoading(false);
        }
    };

    if (!consultation) return null;

    const rating = consultation.review?.rating;
    const feedback = consultation.review?.comment;
    const showCompatibility = ['Love & Relationships', 'Marriage'].includes(consultation.topic || '');

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-gray-100 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] p-6 text-white shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Consultation Details</h2>
                            <p className="text-white/80 text-sm">
                                {new Date(consultation.created_at).toLocaleString()}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex border-b border-gray-200 shrink-0 px-4 pt-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('transcript')}
                        className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-[#E91E63] text-[#E91E63]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Transcript
                    </button>
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-[#E91E63] text-[#E91E63]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Birth Details
                    </button>
                    <button
                        onClick={handleTabKundli}
                        className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'kundli' ? 'border-[#E91E63] text-[#E91E63]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Kundli
                    </button>
                    {showCompatibility && (
                        <button
                            onClick={handleTabCompatibility}
                            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'compatibility' ? 'border-[#E91E63] text-[#E91E63]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Compatibility
                        </button>
                    )}
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'transcript' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
                                        <Clock size={12} /> Time Spent
                                    </p>
                                    <p className="font-bold text-gray-900">{formatDuration(consultation.duration_seconds)}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Earnings</p>
                                    <p className="font-bold text-gray-900">₹{Number(consultation.total_cost || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            {loading ? (
                                <p className="text-sm text-gray-900 text-center py-8">Loading transcript...</p>
                            ) : messages.length === 0 ? (
                                <p className="text-sm text-gray-400 italic text-center py-8">No messages sent in this session.</p>
                            ) : (
                                <div className="space-y-3 pr-1 p-3 rounded-xl border border-gray-100" style={{ backgroundColor: '#F9FAFB' }}>
                                    {messages.map((msg) => {
                                        const isSeeker = msg.sender_id === consultation.seeker_id;
                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isSeeker ? 'items-start' : 'items-end'}`}>
                                                <span className="text-[10px] font-bold mb-0.5" style={{ color: '#4B5563' }}>
                                                    {isSeeker ? (consultation.seeker_profile?.full_name || 'Seeker') : 'You'}
                                                </span>
                                                <div 
                                                    className="px-4 py-2.5 rounded-2xl text-sm max-w-[85%] font-medium leading-relaxed"
                                                    style={isSeeker 
                                                        ? { backgroundColor: '#E5E7EB', color: '#111827', border: '1px solid #D1D5DB', borderTopLeftRadius: '0px' } 
                                                        : { backgroundColor: '#E91E63', color: '#FFFFFF', borderTopRightRadius: '0px' }
                                                    }
                                                >
                                                    {msg.message}
                                                </div>
                                                <span className="text-[9px] mt-1 font-semibold" style={{ color: '#6B7280' }}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Rating &amp; Feedback</p>
                                {rating ? (
                                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={18}
                                                    className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
                                                />
                                            ))}
                                        </div>
                                        {feedback && <p className="text-sm text-yellow-900">{feedback}</p>}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">Seeker hasn't left a rating yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {(consultation.topic || consultation.concern_note) && (
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2 flex items-center gap-1">
                                        <MessageSquare size={12} /> Topic
                                    </p>
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-900">
                                        {consultation.topic && <p className="font-bold text-lg">{consultation.topic}</p>}
                                        {consultation.concern_note && <p className="mt-1">{consultation.concern_note}</p>}
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <h3 className="font-bold text-lg mb-3">Seeker Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase">Name</span>
                                        <span className="font-semibold text-gray-900">{consultation.seeker_profile?.full_name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase">Gender</span>
                                        <span className="font-semibold text-gray-900">{consultation.seeker_profile?.gender || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase">Date of Birth</span>
                                        <span className="font-semibold text-gray-900">{consultation.seeker_profile?.date_of_birth || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase">Time of Birth</span>
                                        <span className="font-semibold text-gray-900">{consultation.seeker_profile?.time_of_birth || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block text-xs uppercase">Place of Birth</span>
                                        <span className="font-semibold text-gray-900">{consultation.seeker_profile?.place_of_birth || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {showCompatibility && consultation.spouse_name && (
                                <div>
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Heart size={18} className="text-[#E91E63]"/> Spouse Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase">Name</span>
                                            <span className="font-semibold text-gray-900">{consultation.spouse_name || 'N/A'}</span>
                                        </div>
                                        <div></div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase">Date of Birth</span>
                                            <span className="font-semibold text-gray-900">{consultation.spouse_date_of_birth || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase">Time of Birth</span>
                                            <span className="font-semibold text-gray-900">{consultation.spouse_time_of_birth || 'N/A'}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500 block text-xs uppercase">Place of Birth</span>
                                            <span className="font-semibold text-gray-900">{consultation.spouse_place_of_birth || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'kundli' && (
                        <div className="h-full relative pb-10">
                            {kundliError && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-center mb-4">{kundliError}</div>}
                            <KundliContent chartData={kundliData} loading={kundliLoading} error={kundliError} canShare={false} />
                        </div>
                    )}

                    {activeTab === 'compatibility' && showCompatibility && (
                        <div className="h-full relative pb-10">
                            {matchError && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-center mb-4">{matchError}</div>}
                            <MatchContent 
                                matchData={matchData} 
                                loading={matchLoading} 
                                error={matchError} 
                                boyName={consultation.seeker_profile?.gender === 'MALE' ? consultation.seeker_profile.full_name : consultation.spouse_name || 'Spouse'}
                                girlName={consultation.seeker_profile?.gender === 'MALE' ? consultation.spouse_name || 'Spouse' : consultation.seeker_profile?.full_name}
                            />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ConsultationDetailModal;
