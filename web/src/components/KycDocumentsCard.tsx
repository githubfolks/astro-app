import React, { useEffect, useState } from 'react';
import type { AstrologerProfile } from '../types';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { resolveImageUrl } from '../utils/url';
import { CreditCard, Landmark, CheckCircle2, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';

const MAX_DOC_SIZE_MB = 5;

interface Props {
    profile: AstrologerProfile;
    onSaved: (updated: AstrologerProfile) => void;
}

export const KycDocumentsCard: React.FC<Props> = ({ profile, onSaved }) => {
    const [panNumber, setPanNumber] = useState('');
    const [panDocUrl, setPanDocUrl] = useState<string | null>(null);
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [aadhaarDocUrl, setAadhaarDocUrl] = useState<string | null>(null);
    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAddress, setBankAddress] = useState('');
    const [uploadingPan, setUploadingPan] = useState(false);
    const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setPanNumber(profile.pan_number || '');
        setPanDocUrl(profile.pan_doc_url || null);
        setAadhaarNumber(profile.aadhaar_number || '');
        setAadhaarDocUrl(profile.aadhaar_doc_url || null);
        setAccountHolderName(profile.bank_account_holder_name || '');
        setAccountNumber(profile.bank_account_number || '');
        setIfsc(profile.bank_ifsc || '');
        setBankName(profile.bank_name || '');
        setBankAddress(profile.bank_address || '');
    }, [profile]);

    const handleDocUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setUploading: (v: boolean) => void,
        setUrl: (v: string) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
            setError(`File too large — max ${MAX_DOC_SIZE_MB}MB`);
            e.target.value = '';
            return;
        }
        setError('');
        setUploading(true);
        try {
            const result = await api.astrologers.uploadDocument(file);
            setUrl(result.url);
        } catch (err) {
            setError(getErrorMessage(err) || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            const updated = await api.astrologers.updateProfile({
                pan_number: panNumber,
                pan_doc_url: panDocUrl,
                aadhaar_number: aadhaarNumber,
                aadhaar_doc_url: aadhaarDocUrl,
                bank_account_holder_name: accountHolderName,
                bank_account_number: accountNumber,
                bank_ifsc: ifsc,
                bank_name: bankName,
                bank_address: bankAddress,
            });
            onSaved(updated);
            setSaved(true);
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to save KYC details');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard size={20} className="text-[#E91E63]" />
                    Document Upload (KYC)
                </h3>
                {profile.kyc_verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        <ShieldCheck size={11} /> Verified
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending Review
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-400 mb-4">Required for payouts. Used for internal verification only — never shown to seekers.</p>

            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">PAN Number</label>
                        <input
                            type="text"
                            autoComplete="off"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">PAN Card Upload (Max {MAX_DOC_SIZE_MB}MB)</label>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocUpload(e, setUploadingPan, setPanDocUrl)}
                            className="w-full text-xs text-gray-600"
                        />
                        {uploadingPan && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
                        {panDocUrl && !uploadingPan && (
                            <div className="mt-1">
                                <p className="text-xs text-green-600 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="flex-shrink-0" /> Uploaded
                                    <a href={resolveImageUrl(panDocUrl)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                                        <ExternalLink size={10} /> View
                                    </a>
                                </p>
                                <p className="text-xs text-gray-400">Select a new file above to replace it.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Aadhaar Number</label>
                        <input
                            type="text"
                            autoComplete="off"
                            value={aadhaarNumber}
                            onChange={(e) => setAadhaarNumber(e.target.value)}
                            placeholder="XXXX XXXX XXXX"
                            maxLength={14}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Aadhaar Upload (Max {MAX_DOC_SIZE_MB}MB)</label>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocUpload(e, setUploadingAadhaar, setAadhaarDocUrl)}
                            className="w-full text-xs text-gray-600"
                        />
                        {uploadingAadhaar && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
                        {aadhaarDocUrl && !uploadingAadhaar && (
                            <div className="mt-1">
                                <p className="text-xs text-green-600 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="flex-shrink-0" /> Uploaded
                                    <a href={resolveImageUrl(aadhaarDocUrl)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                                        <ExternalLink size={10} /> View
                                    </a>
                                </p>
                                <p className="text-xs text-gray-400">Select a new file above to replace it.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-900 uppercase mb-2 flex items-center gap-1.5">
                        <Landmark size={13} /> Bank Details (for payouts)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input
                            type="text"
                            autoComplete="off"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="Account Holder Name"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                        <input
                            type="text"
                            autoComplete="off"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Account Number"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                        <input
                            type="text"
                            autoComplete="off"
                            value={ifsc}
                            onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                            placeholder="IFSC Code"
                            maxLength={11}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <input
                            type="text"
                            autoComplete="off"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="Bank Name"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                        <input
                            type="text"
                            autoComplete="off"
                            value={bankAddress}
                            onChange={(e) => setBankAddress(e.target.value)}
                            placeholder="Bank Branch Address"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                    </div>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
                {saved && !error && <p className="text-xs text-green-600">Saved successfully.</p>}

                <button
                    onClick={handleSave}
                    disabled={saving || uploadingPan || uploadingAadhaar}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {saving ? 'Saving…' : 'Save KYC Details'}
                </button>
            </div>
        </div>
    );
};

export default KycDocumentsCard;
