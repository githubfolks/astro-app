import React, { useState, useEffect } from 'react';
import { X, Clock, Star } from 'lucide-react';
import type { Consultation, ChatHistoryItem } from '../types';
import { api } from '../services/api';
import { resolveImageUrl, getAstrologerDisplayName } from '../utils/url';

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

/** Seeker-facing read-only view of a past consultation: astrologer's short
 * profile, duration/charges, and the full message transcript (including any
 * shared images). Separate from ConsultationDetailModal, which is the
 * astrologer's view and drives astrologer-only actions (Kundli/Compatibility
 * generation) the seeker isn't authorized to call. */
const SeekerChatTranscriptModal: React.FC<Props> = ({ consultation, onClose }) => {
    const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (consultation) {
            setLoading(true);
            setMessages([]);
            api.consultations.getChatHistory(consultation.id)
                .then((data: ChatHistoryItem[]) => setMessages(data))
                .catch((err: unknown) => console.error('Failed to load chat history', err))
                .finally(() => setLoading(false));
        }
    }, [consultation]);

    if (!consultation) return null;

    const rating = consultation.review?.rating;
    const feedback = consultation.review?.comment;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in border border-gray-100 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] p-6 text-white shrink-0">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-white/20 overflow-hidden border-2 border-white/40 flex-shrink-0">
                                <img
                                    src={resolveImageUrl(consultation.astrologer_profile?.profile_picture_url, getAstrologerDisplayName(consultation.astrologer_profile))}
                                    alt="Astrologer"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold truncate">
                                    {consultation.astrologer_profile ? getAstrologerDisplayName(consultation.astrologer_profile) : `Astrologer #${consultation.astrologer_id}`}
                                </h2>
                                <p className="text-white/80 text-xs">
                                    {(() => {
                                        const d = new Date(consultation.created_at);
                                        const dd = String(d.getDate()).padStart(2, '0');
                                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                                        return `${dd}/${mm}/${d.getFullYear()}, ${d.toLocaleTimeString()}`;
                                    })()}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors shrink-0">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
                                <Clock size={12} /> Duration
                            </p>
                            <p className="font-bold text-gray-900">{formatDuration(consultation.duration_seconds)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Charges</p>
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
                                const isMe = msg.sender_id === consultation.seeker_id;
                                const isImage = msg.message_type === 'image' && !!msg.media_url;
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <span className="text-[10px] font-bold mb-0.5" style={{ color: '#4B5563' }}>
                                            {isMe ? 'You' : (consultation.astrologer_profile ? getAstrologerDisplayName(consultation.astrologer_profile) : 'Astrologer')}
                                        </span>
                                        {isImage ? (
                                            <button
                                                type="button"
                                                onClick={() => setPreviewImageUrl(resolveImageUrl(msg.media_url))}
                                                className="p-1.5 rounded-2xl max-w-[85%]"
                                                style={{ backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB' }}
                                            >
                                                <img
                                                    src={resolveImageUrl(msg.media_url)}
                                                    alt={msg.message || 'Shared image'}
                                                    className="rounded-lg max-w-full max-h-56 object-contain bg-white"
                                                />
                                            </button>
                                        ) : (
                                            <div
                                                className="px-4 py-2.5 rounded-2xl text-sm max-w-[85%] font-medium leading-relaxed"
                                                style={isMe
                                                    ? { backgroundColor: '#E91E63', color: '#FFFFFF', borderTopRightRadius: '0px' }
                                                    : { backgroundColor: '#E5E7EB', color: '#111827', border: '1px solid #D1D5DB', borderTopLeftRadius: '0px' }
                                                }
                                            >
                                                {msg.message}
                                            </div>
                                        )}
                                        <span className="text-[9px] mt-1 font-semibold" style={{ color: '#6B7280' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Your Rating &amp; Feedback</p>
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
                            <p className="text-sm text-gray-400">You haven't left a rating yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* In-app image preview — never open a new tab/browser, which on the
                mobile build would leave the WebView. */}
            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(null); }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(null); }}
                        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        aria-label="Close"
                    >
                        <X size={22} />
                    </button>
                    <img
                        src={previewImageUrl}
                        alt="Shared image"
                        onClick={e => e.stopPropagation()}
                        className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                    />
                </div>
            )}
        </div>
    );
};

export default SeekerChatTranscriptModal;
