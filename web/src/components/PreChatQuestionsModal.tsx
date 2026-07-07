import React, { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';

interface PreChatQuestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (answers: { topic: string; concern_note: string }) => void;
    submitting?: boolean;
}

const TOPICS = [
    'Love & Relationships',
    'Marriage',
    'Career & Business',
    'Health & Wellness',
    'Family',
    'Finance',
    'Education',
    'Other',
];

const PreChatQuestionsModal: React.FC<PreChatQuestionsModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    submitting = false,
}) => {
    const [topic, setTopic] = useState('');
    const [concernNote, setConcernNote] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!topic) {
            setError('Please select what you would like to discuss');
            return;
        }
        setError('');
        onSubmit({ topic, concern_note: concernNote.trim() });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] p-5 text-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <HelpCircle size={24} />
                            <h2 className="text-xl font-bold">Before you start</h2>
                        </div>
                        <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="mt-2 text-sm opacity-90">
                        A quick note helps the astrologer prepare for your session
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            What would you like to discuss? *
                        </label>
                        <select
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                        >
                            <option value="">Select a topic</option>
                            {TOPICS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Briefly describe your concern (optional)
                        </label>
                        <textarea
                            value={concernNote}
                            onChange={(e) => setConcernNote(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="e.g. I want to know the right time to start a new job"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-[#E91E63] to-[#FF5722] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                    >
                        {submitting ? 'Starting Chat...' : 'Start Chat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreChatQuestionsModal;
