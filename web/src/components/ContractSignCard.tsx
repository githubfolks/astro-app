import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { FileSignature, CheckCircle2, Loader2 } from 'lucide-react';

interface ContractData {
    version: string;
    text: string;
    signed_at: string | null;
    signature_name: string | null;
}

export const ContractSignCard: React.FC = () => {
    const [contract, setContract] = useState<ContractData | null>(null);
    const [loading, setLoading] = useState(true);
    const [agreed, setAgreed] = useState(false);
    const [signatureInput, setSignatureInput] = useState('');
    const [signing, setSigning] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.astrologers.getContract()
            .then(setContract)
            .catch((e) => setError(getErrorMessage(e) || 'Failed to load contract'))
            .finally(() => setLoading(false));
    }, []);

    const handleSign = async () => {
        if (!signatureInput.trim()) {
            setError('Type your full legal name to sign.');
            return;
        }
        setError('');
        setSigning(true);
        try {
            const result = await api.astrologers.signContract(signatureInput.trim());
            setContract((prev) => prev ? { ...prev, signed_at: result.signed_at, signature_name: result.signature_name } : prev);
        } catch (e) {
            setError(getErrorMessage(e) || 'Failed to sign contract');
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileSignature size={20} className="text-[#E91E63]" />
                Sign the Contract
            </h3>

            {loading ? (
                <p className="text-sm text-gray-400">Loading contract…</p>
            ) : contract?.signed_at ? (
                <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-green-200 bg-green-50 flex items-start gap-3">
                        <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-green-700">Contract signed</p>
                            <p className="text-xs text-green-600 mt-0.5">
                                Signed by {contract.signature_name} on {new Date(contract.signed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Agreement you signed</label>
                        <div className="border border-gray-200 rounded-lg p-3 h-64 overflow-y-auto bg-gray-50 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {contract.text}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Astrologer Partner Agreement</label>
                        <div className="border border-gray-200 rounded-lg p-3 h-64 overflow-y-auto bg-gray-50 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {contract?.text}
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-600">{error}</p>}

                    <label className="flex items-start gap-2 text-xs text-gray-700">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-0.5"
                        />
                        I have read and agree to the Astrologer Partner Agreement above.
                    </label>

                    <div>
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">Type your full legal name to sign</label>
                        <input
                            type="text"
                            value={signatureInput}
                            onChange={(e) => setSignatureInput(e.target.value)}
                            placeholder="e.g. Rohit Kumar Sharma"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E91E63] focus:border-transparent outline-none transition-shadow"
                        />
                    </div>

                    <button
                        onClick={handleSign}
                        disabled={signing || !agreed || !signatureInput.trim()}
                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {signing && <Loader2 size={16} className="animate-spin" />}
                        {signing ? 'Signing…' : 'Sign Contract'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ContractSignCard;
