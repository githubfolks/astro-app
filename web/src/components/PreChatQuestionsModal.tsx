import React, { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';
import CityAutocomplete from './CityAutocomplete';

export interface PreChatAnswers {
    topic: string;
    spouse_name?: string;
    spouse_date_of_birth?: string;
    spouse_time_of_birth?: string;
    spouse_place_of_birth?: string;
}

interface PreChatQuestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (answers: PreChatAnswers) => void;
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
    const [spouseName, setSpouseName] = useState('');
    const [spouseDob, setSpouseDob] = useState('');
    const [spouseTob, setSpouseTob] = useState('');
    const [spousePob, setSpousePob] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const requiresSpouseDetails = topic === 'Love & Relationships' || topic === 'Marriage';

    const handleSubmit = () => {
        if (!topic) {
            setError('Please select what you would like to discuss');
            return;
        }

        const answers: PreChatAnswers = { topic };
        
        if (requiresSpouseDetails) {
            if (spouseName) answers.spouse_name = spouseName.trim();
            if (spouseDob) answers.spouse_date_of_birth = spouseDob;
            if (spouseTob) answers.spouse_time_of_birth = spouseTob + ':00'; // Ensure HH:MM:SS format
            if (spousePob) answers.spouse_place_of_birth = spousePob.trim();
        }

        setError('');
        onSubmit(answers);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in my-8">
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
                        Please provide some details before your session
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

                    {requiresSpouseDetails && (
                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-[#E91E63]">Partner / Spouse Details (Optional)</h3>
                            
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={spouseName}
                                    onChange={(e) => setSpouseName(e.target.value)}
                                    placeholder="Enter name"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        value={spouseDob}
                                        onChange={(e) => setSpouseDob(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Time of Birth
                                    </label>
                                    <input
                                        type="time"
                                        value={spouseTob}
                                        onChange={(e) => setSpouseTob(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Place of Birth
                                </label>
                                <CityAutocomplete
                                    value={spousePob}
                                    onChange={setSpousePob}
                                    placeholder="City, State, India"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                    )}

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
