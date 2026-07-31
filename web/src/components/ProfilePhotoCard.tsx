import React, { useEffect, useState } from 'react';
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
    const [photoError, setPhotoError] = useState('');

    const [shortBio, setShortBio] = useState('');
    const [aboutMe, setAboutMe] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [consultationFeePerMin, setConsultationFeePerMin] = useState('');
    const [languages, setLanguages] = useState('');
    const [specialties, setSpecialties] = useState('');
    const [saving, setSaving] = useState(false);
    const [detailsError, setDetailsError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setShortBio(profile.short_bio || '');
        setAboutMe(profile.about_me || '');
        setExperienceYears(profile.experience_years != null ? String(profile.experience_years) : '');
        setConsultationFeePerMin(profile.consultation_fee_per_min != null ? String(profile.consultation_fee_per_min) : '');
        setLanguages(profile.languages || '');
        setSpecialties(profile.specialties || '');
    }, [profile]);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
            setPhotoError(`File too large — max ${MAX_PHOTO_SIZE_MB}MB`);
            e.target.value = '';
            return;
        }
        setPhotoError('');
        setUploading(true);
        try {
            const result = await api.astrologers.uploadDocument(file);
            const updated = await api.astrologers.updateProfile({ profile_picture_url: result.url });
            onSaved(updated);
        } catch (err) {
            setPhotoError(getErrorMessage(err) || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleSaveDetails = async () => {
        setSaving(true);
        setDetailsError('');
        setSaved(false);
        try {
            const updated = await api.astrologers.updateProfile({
                short_bio: shortBio,
                about_me: aboutMe,
                experience_years: experienceYears ? Number(experienceYears) : null,
                consultation_fee_per_min: consultationFeePerMin ? Number(consultationFeePerMin) : null,
                languages,
                specialties,
            });
            onSaved(updated);
            setSaved(true);
        } catch (err) {
            setDetailsError(getErrorMessage(err) || 'Failed to update profile details');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Camera size={20} className="text-[#E91E63]" />
                Profile Photo
            </h3>
            <p className="text-xs text-gray-400 mb-4">Visible to seekers on your profile. A clear, front-facing photo works best. Max {MAX_PHOTO_SIZE_MB}MB.</p>

            {photoError && <p className="text-xs text-red-600 mb-3">{photoError}</p>}

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

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Short Bio</label>
                    <input
                        type="text"
                        value={shortBio}
                        onChange={(e) => setShortBio(e.target.value)}
                        placeholder="e.g. Vedic astrologer with 10+ years of experience"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">About Me</label>
                    <textarea
                        value={aboutMe}
                        onChange={(e) => setAboutMe(e.target.value)}
                        rows={4}
                        placeholder="Tell seekers about your journey, approach, and expertise"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Experience (years)</label>
                        <input
                            type="number"
                            min="0"
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                            placeholder="e.g. 10"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Fee (₹/min)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={consultationFeePerMin}
                            onChange={(e) => setConsultationFeePerMin(e.target.value)}
                            placeholder="e.g. 20"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Languages</label>
                    <input
                        type="text"
                        value={languages}
                        onChange={(e) => setLanguages(e.target.value)}
                        placeholder="e.g. Hindi, English, Sanskrit"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Specialties</label>
                    <input
                        type="text"
                        value={specialties}
                        onChange={(e) => setSpecialties(e.target.value)}
                        placeholder="e.g. Vedic, Palmistry, Tarot"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                    />
                </div>

                {detailsError && <p className="text-xs text-red-600">{detailsError}</p>}
                {saved && !detailsError && <p className="text-xs text-green-600">Saved successfully.</p>}

                <button
                    onClick={handleSaveDetails}
                    disabled={saving}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Profile Details'}
                </button>
            </div>
        </div>
    );
};

export default ProfilePhotoCard;
