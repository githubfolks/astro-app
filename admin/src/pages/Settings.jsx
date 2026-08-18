import React, { useEffect, useState, useRef } from 'react';
import api, { settings as settingsApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { MessageCircle, Wifi, WifiOff, RefreshCw, AlertCircle, Search, X, Trash2 } from 'lucide-react';

const GROUPS = [
    {
        title: 'Support Contact',
        desc: 'Shown in the footer of every outgoing email and used wherever the platform surfaces a support contact.',
        fields: [
            { key: 'support_email', label: 'Support Email' },
            { key: 'support_phone', label: 'Support Phone Number' },
        ],
    },
    {
        title: 'Moderation Alerts',
        desc: 'Where to send alerts when spam / contact-sharing is detected in chats.',
        fields: [
            { key: 'moderation_admin_user_id', label: 'Super-admin User ID (in-app alert)' },
            { key: 'moderation_admin_whatsapp', label: 'Super-admin WhatsApp Number' },
            { key: 'moderation_admin_template', label: 'Template: Admin Alert', textarea: true },
        ],
    },
    {
        title: 'Tunables',
        fields: [
            { key: 'request_stale_minutes', label: 'Auto-expire unanswered requests after (minutes)' },
            { key: 'presence_ttl_seconds', label: 'Presence heartbeat TTL (seconds)' },
        ],
    },
    {
        title: 'Promotions',
        desc: 'A seeker\'s very first chat is billed at this flat rate for the first 5 minutes, instead of the astrologer\'s normal per-minute rate.',
        fields: [
            { key: 'promo_first_chat_amount', label: 'First Chat Promotional Rate (₹ for first 5 minutes)' },
        ],
    },
    {
        title: 'Razorpay Payment Gateway',
        desc: 'Test and live key pairs from https://dashboard.razorpay.com/app/keys. New orders use whichever mode is selected below; orders already placed keep using the key pair they were created under, even if you switch modes afterward.',
        fields: [
            {
                key: 'razorpay_mode',
                label: 'Active Mode',
                select: true,
                options: [
                    { value: 'test', label: 'Test' },
                    { value: 'live', label: 'Live' },
                ],
                warning: '"Live" charges real money. Double-check this is set to "Test" before trying out payments.',
            },
            { key: 'razorpay_key_id_test', label: 'Test Key ID (rzp_test_...)' },
            { key: 'razorpay_key_secret_test', label: 'Test Key Secret', secret: true },
            { key: 'razorpay_key_id_live', label: 'Live Key ID (rzp_live_...)' },
            { key: 'razorpay_key_secret_live', label: 'Live Key Secret', secret: true },
            { key: 'razorpay_webhook_secret_test', label: 'Test Webhook Secret', secret: true },
            { key: 'razorpay_webhook_secret_live', label: 'Live Webhook Secret', secret: true },
        ],
    },
    {
        title: 'Facebook & Instagram Integration',
        desc: 'Configure Facebook Page ID and Instagram Business Account details for automated post sharing.',
        fields: [
            { key: 'facebook_page_id', label: 'Facebook Page ID' },
            { key: 'facebook_access_token', label: 'Facebook Page Access Token', secret: true },
            { key: 'instagram_business_account_id', label: 'Instagram Business Account ID' },
            { key: 'instagram_access_token', label: 'Instagram Access Token', secret: true },
        ],
    },
    {
        title: 'Content Studio (Bhashini Hindi Voice)',
        desc: 'Credentials from bhashini.gov.in (My Profile) used to generate Hindi narration audio when rendering Content Studio videos.',
        fields: [
            { key: 'bhashini_user_id', label: 'Bhashini User ID' },
            { key: 'bhashini_api_key', label: 'Bhashini API Key', secret: true },
            { key: 'bhashini_pipeline_id', label: 'Bhashini Pipeline ID' },
        ],
    },
    {
        title: 'Content Studio (Google TTS Fallback)',
        desc: 'Google Cloud Text-to-Speech API key, used to generate Hindi narration when Bhashini is unconfigured or fails.',
        fields: [
            { key: 'google_tts_api_key', label: 'Google Cloud TTS API Key', secret: true },
        ],
    },
    {
        title: 'Content Studio (Social Posting)',
        desc: 'The public URL where this API\'s /static files are reachable (e.g. https://api.aadikarta.org). Required for Facebook/Instagram to fetch Content Studio videos when posting — they cannot reach localhost or private URLs.',
        fields: [
            { key: 'content_studio_public_base_url', label: 'Public API Base URL' },
            { key: 'content_studio_caption_cta', label: 'Caption Call-to-Action (appended to every AI-generated caption)', textarea: true },
        ],
    },
];

function TokenStatusRow({ label, status }) {
    if (!status) return null;
    if (!status.configured) {
        return <p className="text-xs text-gray-400">{label}: not configured</p>;
    }
    if (status.error) {
        return (
            <p className="text-xs text-red-600 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {label}: {status.error}
            </p>
        );
    }
    if (!status.valid) {
        return (
            <p className="text-xs text-red-600 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {label}: token is invalid or expired — posting will fail until it's renewed.
            </p>
        );
    }
    if (status.never_expires) {
        return <p className="text-xs text-emerald-600">{label}: valid, does not expire.</p>;
    }
    const soon = status.days_left != null && status.days_left <= 14;
    return (
        <p className={`text-xs flex items-start gap-1 ${soon ? 'text-amber-600' : 'text-emerald-600'}`}>
            {soon && <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
            {label}: valid, expires in {status.days_left} day{status.days_left === 1 ? '' : 's'}
            {soon ? ' — renew soon.' : '.'}
        </p>
    );
}

function SocialTokenStatusPanel() {
    const [status, setStatus] = useState(null);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');

    const check = async () => {
        setChecking(true);
        setError('');
        try {
            const res = await settingsApi.getSocialTokenStatus();
            setStatus(res.data);
        } catch (e) {
            setError(e.message || 'Failed to check token status.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-gray-800">Facebook / Instagram Token Status</h2>
                <Button size="sm" variant="outlined" onClick={check} disabled={checking}>
                    {checking ? 'Checking…' : 'Check Now'}
                </Button>
            </div>
            <p className="text-xs text-gray-900 mb-3">Verifies the saved access tokens against the Graph API and shows expiry, so a stale token is caught before Content Studio posting fails.</p>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {status && (
                <div className="space-y-1.5">
                    <TokenStatusRow label="Facebook" status={status.facebook} />
                    <TokenStatusRow label="Instagram" status={status.instagram} />
                </div>
            )}
        </div>
    );
}

function WhatsAppPanel({ isConfigured, waStatus, isConnecting, isStopping, phone, onPhoneChange, onConnect, onStop, error }) {
    const state = String(waStatus?.status || '').toUpperCase();
    const isConnected = state === 'CONNECTED';
    const pairingCode = waStatus?.pairing_code || waStatus?.code;
    const isPairing = state === 'CONNECTING' && !!pairingCode;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-gray-800">WhatsApp Notification Device</h2>
                    <p className="text-xs text-gray-900">Pair your platform WhatsApp account to send alerts and notifications.</p>
                </div>
                <div className="ml-auto">
                    {!isConfigured ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                            <WifiOff className="w-3.5 h-3.5" /> Not Configured
                        </span>
                    ) : isConnected ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
                            <Wifi className="w-3.5 h-3.5" /> Connected
                        </span>
                    ) : isPairing ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-600 border border-yellow-100">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pairing…
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-900 border border-gray-100">
                            <WifiOff className="w-3.5 h-3.5" /> Disconnected
                        </span>
                    )}
                </div>
            </div>

            {!isConfigured && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>WAPlex Gateway is not configured. Set the WAPLEX_BASE_URL and WAPLEX_ADMIN_KEY environment variables first.</span>
                </div>
            )}

            {isConfigured && isPairing && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-yellow-800">Enter this pairing code in WhatsApp:</p>
                    {pairingCode ? (
                        <p className="text-3xl font-mono font-bold tracking-widest text-yellow-900 text-center py-2 bg-white/50 rounded-lg border border-yellow-200">
                            {pairingCode}
                        </p>
                    ) : (
                        <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 py-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generating pairing code…
                        </div>
                    )}
                    <p className="text-xs text-yellow-700">
                        Open WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number
                    </p>
                </div>
            )}

            {isConfigured && !isConnected && (
                <div className="space-y-3">
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Connection Error</p>
                                <p className="text-xs mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}
                    {!isPairing && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">
                                WhatsApp Phone Number
                            </label>
                            <input
                                type="tel"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. 919876543210 (country code + number, no + or spaces)"
                                value={phone}
                                onChange={e => onPhoneChange(e.target.value)}
                                disabled={isConnecting}
                            />
                            <p className="text-xs text-gray-400 mt-1">Include country code (e.g. 91 for India, 1 for US)</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={onConnect}
                            disabled={isConnecting || isPairing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2 px-4 rounded-lg shadow disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                        >
                            {isConnecting ? 'Starting…' : 'Connect WhatsApp'}
                        </button>
                        {isPairing && (
                            <button
                                onClick={onStop}
                                disabled={isStopping}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2 px-4 rounded-lg shadow disabled:opacity-50 transition duration-200"
                            >
                                Cancel Pairing
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isConfigured && isConnected && (
                <button
                    onClick={onStop}
                    disabled={isStopping}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm py-2 px-4 rounded-lg border border-red-200 disabled:opacity-50 transition duration-200"
                >
                    {isStopping ? 'Disconnecting…' : 'Disconnect WhatsApp Device'}
                </button>
            )}

            {isConfigured && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700 space-y-1">
                    <p className="font-semibold">Device Pairing Steps:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-indigo-600">
                        <li>Ensure WAPlex configuration variables are set in the backend environment.</li>
                        <li>Enter your phone number (including country code) and click "Connect WhatsApp".</li>
                        <li>Enter the 8-character code displayed above in WhatsApp Link Device section.</li>
                    </ol>
                </div>
            )}
        </div>
    );
}

// Wipes WalletTransaction rows, resets UserWallet.balance to 0, and deletes
// Payout rows for selected users -- the cleanup path for mock/seed financial
// data left over from testing. Deliberately kept as its own self-contained
// component: it manages its own search/selection/preview state and doesn't
// touch the key/value settings form above it.
function MockDataCleanupPanel() {
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState([]); // [{id, email, role}]
    const [preview, setPreview] = useState(null); // [{user_id, email, role, wallet_balance, transaction_count, payout_count}]
    const [previewLoading, setPreviewLoading] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const searchDebounceRef = useRef(null);

    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (!search.trim()) { setSearchResults([]); return; }
        searchDebounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await api.get('/admin/users', { params: { search, limit: 8 } });
                const selectedIds = new Set(selected.map(u => u.id));
                // Admin accounts are hard-blocked server-side too; filtering here
                // just keeps them from being offered as a selectable option at all.
                setSearchResults((res.data?.users || []).filter(u => !selectedIds.has(u.id) && u.role !== 'ADMIN'));
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(searchDebounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const fetchPreview = async (users) => {
        if (users.length === 0) { setPreview(null); return; }
        setPreviewLoading(true);
        setError('');
        try {
            const res = await api.get('/admin/users/mock-data-preview', { params: { user_ids: users.map(u => u.id).join(',') } });
            setPreview(res.data.results);
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to load preview');
            setPreview(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const addUser = (user) => {
        const next = [...selected, user];
        setSelected(next);
        setSearch('');
        setSearchResults([]);
        setResult(null);
        setConfirmEmail('');
        fetchPreview(next);
    };

    const removeUser = (id) => {
        const next = selected.filter(u => u.id !== id);
        setSelected(next);
        setResult(null);
        setConfirmEmail('');
        fetchPreview(next);
    };

    const confirmMatches = confirmEmail.trim() !== '' && selected.some(u => (u.email || '').trim().toLowerCase() === confirmEmail.trim().toLowerCase());

    const handleDelete = async () => {
        if (!confirmMatches) return;
        setDeleting(true);
        setError('');
        try {
            const res = await api.post('/admin/users/delete-mock-data', { user_ids: selected.map(u => u.id) });
            setResult(res.data.results);
            setSelected([]);
            setPreview(null);
            setConfirmEmail('');
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to delete mock data');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm space-y-4">
            <div>
                <h2 className="font-bold text-gray-800 mb-1">Delete Mock User Data</h2>
                <p className="text-xs text-gray-900">
                    Permanently deletes wallet transactions, resets the wallet balance to ₹0, and deletes payout
                    records for the selected user(s). Cannot be undone — use this to clear out test/seed data, not
                    for real user accounts. Admin accounts cannot be selected.
                </p>
            </div>

            <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users by email or phone…"
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-red-400 outline-none"
                />
                {searching && <RefreshCw className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />}
                {searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                        {searchResults.map(u => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => addUser(u)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                            >
                                <span>{u.email || u.phone_number}</span>
                                <span className="text-xs text-gray-400">{u.role}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selected.map(u => (
                        <span key={u.id} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            {u.email || u.phone_number}
                            <button type="button" onClick={() => removeUser(u.id)} className="hover:text-red-600">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {previewLoading && <p className="text-xs text-gray-400">Loading preview…</p>}

            {preview && preview.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase">
                            <tr>
                                <th className="text-left px-3 py-2">User</th>
                                <th className="text-right px-3 py-2">Wallet Balance</th>
                                <th className="text-right px-3 py-2">Transactions</th>
                                <th className="text-right px-3 py-2">Payouts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {preview.map(p => (
                                <tr key={p.user_id}>
                                    <td className="px-3 py-2 text-gray-900">{p.email}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">₹{p.wallet_balance.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{p.transaction_count}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{p.payout_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {selected.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-900 uppercase">
                        Type the email of one selected user to confirm
                    </label>
                    <input
                        type="text"
                        value={confirmEmail}
                        onChange={e => setConfirmEmail(e.target.value)}
                        placeholder="e.g. seeker3@example.com"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-400 outline-none"
                    />
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={!confirmMatches || deleting}
                        startIcon={<Trash2 className="w-4 h-4" />}
                    >
                        {deleting ? 'Deleting…' : `Delete Mock Data for ${selected.length} User${selected.length > 1 ? 's' : ''}`}
                    </Button>
                </div>
            )}

            {result && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 space-y-1">
                    <p className="font-semibold">Done:</p>
                    {result.map(r => (
                        <p key={r.user_id}>
                            {r.email}: {r.transactions_deleted} transaction(s) deleted, {r.payouts_deleted} payout(s) deleted, wallet reset from ₹{r.wallet_reset_from.toFixed(2)} to ₹0.
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Settings() {
    const [values, setValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // WAPlex state
    const [waStatus, setWaStatus] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [waPhone, setWaPhone] = useState('');
    const [waError, setWaError] = useState('');
    const waPollRef = useRef(null);

    const load = async () => {
        try {
            setLoading(true);
            const res = await settingsApi.get();
            setValues(res.data || {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const fetchWaStatus = async () => {
        try {
            const res = await settingsApi.getWhatsappStatus();
            setWaStatus(prev => {
                const next = { ...prev, ...res.data };
                // The status poll often returns a null pairing_code (the code is only
                // emitted by start_session, not by status checks). Keep the last known
                // code so it doesn't blink out from under the user while pairing.
                const incomingCode = res.data?.pairing_code || res.data?.code;
                if (!incomingCode && prev?.pairing_code) {
                    next.pairing_code = prev.pairing_code;
                }
                return next;
            });
            return res.data;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const startWaPoll = () => {
        if (waPollRef.current) return;
        waPollRef.current = setInterval(async () => {
            const s = await fetchWaStatus();
            if (s && String(s.status || '').toUpperCase() === 'CONNECTED') {
                clearInterval(waPollRef.current);
                waPollRef.current = null;
            }
        }, 4000);
        setTimeout(() => {
            if (waPollRef.current) {
                clearInterval(waPollRef.current);
                waPollRef.current = null;
            }
        }, 5 * 60_000);
    };

    useEffect(() => {
        fetchWaStatus().then(s => {
            if (s && String(s.status || '').toUpperCase() === 'CONNECTING') {
                startWaPoll();
            }
        });
        return () => {
            if (waPollRef.current) clearInterval(waPollRef.current);
        };
    }, []);

    const handleWaConnect = async () => {
        const phone = waPhone.replace(/\D/g, '');
        if (!phone) {
            setWaError('Please enter a WhatsApp phone number first.');
            return;
        }
        setWaError('');
        setIsConnecting(true);
        try {
            const res = await settingsApi.connectWhatsapp(phone);
            setWaStatus(prev => ({ ...prev, status: 'CONNECTING', pairing_code: res.data?.pairing_code }));
            startWaPoll();
        } catch (err) {
            setWaError(err.message || 'Failed to connect WhatsApp');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleWaStop = async () => {
        if (!window.confirm('Disconnect WhatsApp device from the platform?')) return;
        setIsStopping(true);
        setWaError('');
        if (waPollRef.current) { clearInterval(waPollRef.current); waPollRef.current = null; }
        try {
            await settingsApi.disconnectWhatsapp();
            setWaStatus(null);
            setWaPhone('');
        } catch (err) {
            setWaError(err.message || 'Failed to disconnect WhatsApp');
        } finally {
            setIsStopping(false);
        }
    };

    const onChange = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

    const renderField = (f) => {
        if (f.boolean) {
            const checked = String(values[f.key] ?? 'false').toLowerCase() === 'true';
            return (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => onChange(f.key, e.target.checked ? 'true' : 'false')}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-gray-900 uppercase">{f.label}</span>
                    <span className={`text-xs font-semibold ${checked ? 'text-emerald-600' : 'text-gray-400'}`}>
                        ({checked ? 'Enabled' : 'Disabled'})
                    </span>
                </label>
            );
        }
        if (f.select) {
            return (
                <select
                    value={values[f.key] ?? ''}
                    onChange={e => onChange(f.key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    {f.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }
        if (f.textarea) {
            return (
                <textarea
                    rows={2}
                    value={values[f.key] ?? ''}
                    onChange={e => onChange(f.key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            );
        }
        return (
            <input
                type={f.secret ? 'password' : 'text'}
                value={values[f.key] ?? ''}
                onChange={e => onChange(f.key, e.target.value)}
                placeholder={f.secret ? '******** (leave to keep current)' : ''}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
        );
    };

    const renderGroup = (group) => (
        <div key={group.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-1">{group.title}</h2>
            {group.desc && <p className="text-xs text-gray-900 mb-4">{group.desc}</p>}
            <div className="space-y-4">
                {group.fields.map(f => (
                    <div key={f.key}>
                        {!f.boolean && <label className="block text-xs font-semibold text-gray-900 uppercase mb-1">{f.label}</label>}
                        {renderField(f)}
                        {f.warning && (
                            <p className="text-xs text-amber-600 mt-1.5 flex items-start gap-1">
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                {f.warning}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const save = async () => {
        try {
            setSaving(true);
            setMsg('');
            // Don't resend masked secrets unchanged.
            const payload = {};
            Object.entries(values).forEach(([k, v]) => {
                if (v === '********') return;
                payload[k] = v;
            });
            const res = await settingsApi.update(payload);
            setValues(res.data || {});
            setMsg('Settings saved.');
        } catch (e) {
            console.error(e);
            setMsg('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-gray-900">Loading settings…</div>;

    const isWaplexConfigured = waStatus?.is_configured;

    return (
        <div className="p-6 max-w-6xl w-full">
            <h1 className="text-2xl text-gray-900 mb-1">Platform Settings</h1>
            <p className="text-gray-900 mb-6 text-sm">Configure WhatsApp notification gateway, moderation alerts, and system tunables.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-6">
                {/* Left Column */}
                <div className="space-y-6">
                    <WhatsAppPanel
                        isConfigured={isWaplexConfigured}
                        waStatus={waStatus}
                        isConnecting={isConnecting}
                        isStopping={isStopping}
                        phone={waPhone}
                        onPhoneChange={setWaPhone}
                        onConnect={handleWaConnect}
                        onStop={handleWaStop}
                        error={waError}
                    />

                    {GROUPS.filter(g => ['Support Contact', 'Tunables', 'Promotions', 'Razorpay Payment Gateway'].includes(g.title)).map(renderGroup)}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {GROUPS.filter(g => g.title === 'Moderation Alerts').map(renderGroup)}
                    {GROUPS.filter(g => g.title === 'Facebook & Instagram Integration').map(renderGroup)}
                    <SocialTokenStatusPanel />
                    {GROUPS.filter(g => ['Content Studio (Bhashini Hindi Voice)', 'Content Studio (Google TTS Fallback)', 'Content Studio (Social Posting)'].includes(g.title)).map(renderGroup)}
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
                {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>

            <MockDataCleanupPanel />
        </div>
    );
}
