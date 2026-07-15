import React, { useState } from 'react';
import type { AstrologerProfile } from '../types';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { resolveImageUrl } from '../utils/url';
import { Award, FileText, X, Loader2, Plus } from 'lucide-react';

const MAX_CERT_SIZE_MB = 5;

interface Props {
    profile: AstrologerProfile;
    onSaved: (updated: AstrologerProfile) => void;
}

const fileNameFromUrl = (url: string) => url.split('/').pop() || 'Certificate';
const isPdf = (url: string) => url.toLowerCase().endsWith('.pdf');

export const CertificatesCard: React.FC<Props> = ({ profile, onSaved }) => {
    const certs = profile.certificate_urls || [];
    const [uploading, setUploading] = useState(false);
    const [removingIndex, setRemovingIndex] = useState<number | null>(null);
    const [error, setError] = useState('');

    const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_CERT_SIZE_MB * 1024 * 1024) {
            setError(`File too large — max ${MAX_CERT_SIZE_MB}MB`);
            e.target.value = '';
            return;
        }
        setError('');
        setUploading(true);
        try {
            const result = await api.astrologers.uploadDocument(file);
            const updatedUrls = [...certs, result.url];
            const updated = await api.astrologers.updateProfile({ certificate_urls: updatedUrls });
            onSaved(updated);
        } catch (err) {
            setError(getErrorMessage(err) || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleRemove = async (index: number) => {
        setRemovingIndex(index);
        setError('');
        try {
            const updatedUrls = certs.filter((_, i) => i !== index);
            const updated = await api.astrologers.updateProfile({ certificate_urls: updatedUrls });
            onSaved(updated);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to remove certificate');
        } finally {
            setRemovingIndex(null);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Award size={20} className="text-[#E91E63]" />
                Certificates <span className="text-[10px] font-normal text-gray-400 uppercase tracking-wide">Optional</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">Astrology certificates, for internal verification only — not shown to seekers. Max {MAX_CERT_SIZE_MB}MB each.</p>

            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

            <div className="space-y-2 mb-3">
                {certs.map((url, i) => (
                    <div key={url} className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
                        {isPdf(url) ? (
                            <FileText size={16} className="text-gray-400 flex-shrink-0" />
                        ) : (
                            <img src={resolveImageUrl(url)} alt="Certificate" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <a href={resolveImageUrl(url)} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-700 truncate flex-1 hover:underline">
                            {fileNameFromUrl(url)}
                        </a>
                        <button
                            onClick={() => handleRemove(i)}
                            disabled={removingIndex === i}
                            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            title="Remove certificate"
                        >
                            {removingIndex === i ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                        </button>
                    </div>
                ))}
            </div>

            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-400 hover:border-[#E91E63] hover:text-[#E91E63] cursor-pointer transition-colors text-xs font-semibold">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {uploading ? 'Uploading…' : 'Add Certificate'}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleAdd} disabled={uploading} />
            </label>
        </div>
    );
};

export default CertificatesCard;
