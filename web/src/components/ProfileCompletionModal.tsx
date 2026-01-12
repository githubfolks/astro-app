import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface ProfileCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    initialProfile: any;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
    isOpen,
    onClose,
    onComplete,
    initialProfile
}) => {
    const [profile, setProfile] = useState({
        full_name: initialProfile?.full_name || '',
        date_of_birth: initialProfile?.date_of_birth || '',
        time_of_birth: initialProfile?.time_of_birth || '',
        place_of_birth: initialProfile?.place_of_birth || '',
        gender: initialProfile?.gender || ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        // Validate all fields
        if (!profile.full_name || !profile.date_of_birth || !profile.time_of_birth || !profile.place_of_birth || !profile.gender) {
            setError('All fields are required for accurate predictions');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await api.seekers.updateProfile(profile);
            onComplete();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to save profile. Please try again.');
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] p-5 text-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={24} />
                            <h2 className="text-xl font-bold">Complete Your Profile</h2>
                        </div>
                        <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="mt-2 text-sm opacity-90">
                        Birth details are required for accurate astrological predictions
                    </p>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                        <input
                            type="text"
                            value={profile.full_name}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth *</label>
                            <input
                                type="date"
                                value={profile.date_of_birth}
                                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Time of Birth *</label>
                            <input
                                type="time"
                                value={profile.time_of_birth}
                                onChange={(e) => setProfile({ ...profile, time_of_birth: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Place of Birth *</label>
                        <input
                            type="text"
                            value={profile.place_of_birth}
                            onChange={(e) => setProfile({ ...profile, place_of_birth: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                            placeholder="City, Country"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Gender *</label>
                        <select
                            value={profile.gender}
                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none"
                        >
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-[#E91E63] to-[#FF5722] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                    >
                        {saving ? 'Saving...' : 'Save & Continue to Chat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionModal;
