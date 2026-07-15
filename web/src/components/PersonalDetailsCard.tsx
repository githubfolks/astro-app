import React, { useEffect, useState } from 'react';
import type { AstrologerProfile } from '../types';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { User } from 'lucide-react';

interface Props {
    profile: AstrologerProfile;
    onSaved: (updated: AstrologerProfile) => void;
}

export const PersonalDetailsCard: React.FC<Props> = ({ profile, onSaved }) => {
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setWhatsappNumber(profile.whatsapp_number || '');
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            const updated = await api.astrologers.updateProfile({ whatsapp_number: whatsappNumber });
            onSaved(updated);
            setSaved(true);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to update WhatsApp number');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-[#E91E63]" />
                Personal Details
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Alternate / WhatsApp Number</label>
                    <input
                        type="tel"
                        autoComplete="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                    />
                    <p className="text-xs text-gray-400 mt-1">Used by our team to reach you; not shown to seekers.</p>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
                {saved && !error && <p className="text-xs text-green-600">Saved successfully.</p>}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Personal Details'}
                </button>
            </div>
        </div>
    );
};

export default PersonalDetailsCard;
