import React, { useState } from 'react';
import type { AstrologerProfile } from '../types';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { resolveImageUrl } from '../utils/url';
import { Camera, Loader2 } from 'lucide-react';

const MAX_PHOTO_SIZE_MB = 5;

interface Props {
    profile: AstrologerProfile;
    onSaved: (updated: AstrologerProfile) => void;
}

export const ProfilePhotoCard: React.FC<Props> = ({ profile, onSaved }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
            setError(`File too large — max ${MAX_PHOTO_SIZE_MB}MB`);
            e.target.value = '';
            return;
        }
        setError('');
        setUploading(true);
        try {
            const result = await api.astrologers.uploadDocument(file);
            const updated = await api.astrologers.updateProfile({ profile_picture_url: result.url });
            onSaved(updated);
        } catch (err) {
            setError(getErrorMessage(err) || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Camera size={20} className="text-[#E91E63]" />
                Profile Photo
            </h3>
            <p className="text-xs text-gray-400 mb-4">Visible to seekers on your profile. A clear, front-facing photo works best. Max {MAX_PHOTO_SIZE_MB}MB.</p>

            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

            <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full bg-purple-100 overflow-hidden border border-gray-200 flex-shrink-0">
                    <img
                        src={resolveImageUrl(profile.profile_picture_url, profile.full_name)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 size={20} className="text-white animate-spin" />
                        </div>
                    )}
                </div>

                <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold py-2 px-4 rounded-lg transition-colors">
                    {uploading ? 'Uploading…' : 'Change Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={uploading} />
                </label>
            </div>
        </div>
    );
};

export default ProfilePhotoCard;
