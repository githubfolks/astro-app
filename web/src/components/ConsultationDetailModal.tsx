import React from 'react';
import { Star, X, Clock, MessageSquare, User } from 'lucide-react';
import type { Consultation } from '../types';
import { api } from '../services/api';

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
    const [messages, setMessages] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (consultation) {
            setLoading(true);
            setMessages([]);
            api.consultations.getChatHistory(consultation.id)
                .then((data: any) => {
                    setMessages(data);
                    setLoading(false);
                })
                .catch((err: any) => {
                    console.error('Failed to load chat history', err);
                    setLoading(false);
                });
        }
    }, [consultation]);

    if (!consultation) return null;

    const rating = consultation.review?.rating;
    const feedback = consultation.review?.comment;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] p-6 text-white">
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

                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Seeker</p>
                            <p className="font-bold text-gray-900">{consultation.seeker_profile?.full_name || `User #${consultation.seeker_id}`}</p>
                        </div>
                    </div>

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

                    {(consultation.topic || consultation.concern_note) && (
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2 flex items-center gap-1">
                                <MessageSquare size={12} /> What the seeker wanted to discuss
                            </p>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-900">
                                {consultation.topic && <p className="font-semibold">{consultation.topic}</p>}
                                {consultation.concern_note && <p className="mt-1">{consultation.concern_note}</p>}
                            </div>
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

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-3 flex items-center gap-1">
                            <MessageSquare size={12} /> Chat Transcript
                        </p>
                        {loading ? (
                            <p className="text-sm text-gray-500">Loading transcript...</p>
                        ) : messages.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No messages sent in this session.</p>
                        ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 p-3 rounded-xl border border-gray-100" style={{ backgroundColor: '#F9FAFB' }}>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultationDetailModal;
