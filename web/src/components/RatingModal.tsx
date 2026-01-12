import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';

interface RatingModalProps {
    isOpen: boolean;
    astrologerName: string;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    onSkip: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
    isOpen,
    astrologerName,
    onSubmit,
    onSkip
}) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;
        setSubmitting(true);
        try {
            await onSubmit(rating, comment);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Rate Your Session</h2>
                            <p className="text-white/80 text-sm">with {astrologerName}</p>
                        </div>
                        <button
                            onClick={onSkip}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Star Rating */}
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">How was your experience?</p>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110 active:scale-95"
                                >
                                    <Star
                                        size={40}
                                        className={`transition-colors ${star <= (hoveredRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'fill-gray-200 text-gray-200'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-sm text-gray-500 mt-2">
                                {rating === 5 && '⭐ Excellent!'}
                                {rating === 4 && '👍 Very Good'}
                                {rating === 3 && '👌 Good'}
                                {rating === 2 && '😐 Fair'}
                                {rating === 1 && '😔 Poor'}
                            </p>
                        )}
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add a comment (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onSkip}
                        className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || submitting}
                        className="flex-1 py-3 rounded-xl font-semibold text-white bg-[#E91E63] hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Send size={18} />
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
