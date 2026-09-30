import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { getErrorMessage } from '../utils/errors';

/**
 * Seeker self-service account deletion. The server refuses while the wallet
 * has a balance, a consultation is in progress, or a dispute is open, and
 * returns a message saying why — shown here as-is.
 */
const DeleteAccountCard: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const close = () => {
        setOpen(false);
        setConfirmText('');
        setError(null);
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError(null);
        try {
            await api.seekers.deleteAccount();
            // The token is now rejected server-side, so skip AuthContext.logout()
            // (its API calls would 401) and just clear the local session.
            await storage.removeItem('token');
            await storage.removeItem('user');
            window.location.href = '/';
        } catch (e) {
            setError(getErrorMessage(e) || 'Could not delete your account. Please try again.');
            setDeleting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Trash2 className="text-red-600" size={20} />
                Delete Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Permanently delete your account and personal details (name, contact details, birth details).
                Transaction and tax records are kept as required by law, and past chat messages are erased
                on our standard retention schedule. See our <a href="/privacy-policy" className="underline text-orange-600">Privacy Policy</a>.
            </p>
            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    className="w-full border border-red-300 text-red-700 font-semibold py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                    Delete my account
                </button>
            ) : (
                <div className="space-y-3">
                    <label htmlFor="delete-account-confirm" className="block text-sm text-gray-800">
                        This cannot be undone. Type <span className="font-mono font-bold">DELETE</span> to confirm.
                    </label>
                    <input
                        id="delete-account-confirm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        autoComplete="off"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    />
                    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                    <div className="flex gap-2">
                        <button
                            onClick={close}
                            disabled={deleting}
                            className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={confirmText !== 'DELETE' || deleting}
                            className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {deleting ? 'Deleting…' : 'Delete permanently'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeleteAccountCard;
