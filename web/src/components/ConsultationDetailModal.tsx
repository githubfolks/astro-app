import React from 'react';
import { Star, X, Clock, MessageSquare, User } from 'lucide-react';
import type { Consultation } from '../types';

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
    if (!consultation) return null;

    const rating = consultation.review?.rating;
    const feedback = consultation.review?.comment;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
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

                <div className="p-6 space-y-5">
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
                </div>
            </div>
        </div>
    );
};

export default ConsultationDetailModal;
