import React, { useEffect, useState, useRef } from 'react';
import { settings as settingsApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { MessageCircle, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

const GROUPS = [
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
        title: 'Facebook & Instagram Integration',
        desc: 'Configure Facebook Page ID and Instagram Business Account details for automated post sharing.',
        fields: [
            { key: 'facebook_page_id', label: 'Facebook Page ID' },
            { key: 'facebook_access_token', label: 'Facebook Page Access Token', secret: true },
            { key: 'instagram_business_account_id', label: 'Instagram Business Account ID' },
            { key: 'instagram_access_token', label: 'Instagram Access Token', secret: true },
        ],
    },
];

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
                    <p className="text-xs text-gray-500">Pair your platform WhatsApp account to send alerts and notifications.</p>
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-100">
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
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
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

    if (loading) return <div className="p-6 text-gray-500">Loading settings…</div>;

    const isWaplexConfigured = waStatus?.is_configured;

    return (
        <div className="p-6 max-w-6xl w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Platform Settings</h1>
            <p className="text-gray-500 mb-6 text-sm">Configure WhatsApp notification gateway, moderation alerts, and system tunables.</p>

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

                    {GROUPS.filter(g => ['Tunables', 'Promotions'].includes(g.title)).map(group => (
                        <div key={group.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="font-bold text-gray-800 mb-1">{group.title}</h2>
                            {group.desc && <p className="text-xs text-gray-500 mb-4">{group.desc}</p>}
                            <div className="space-y-4">
                                {group.fields.map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{f.label}</label>
                                        {f.textarea ? (
                                            <textarea
                                                rows={2}
                                                value={values[f.key] ?? ''}
                                                onChange={e => onChange(f.key, e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        ) : (
                                            <input
                                                type={f.secret ? 'password' : 'text'}
                                                value={values[f.key] ?? ''}
                                                onChange={e => onChange(f.key, e.target.value)}
                                                placeholder={f.secret ? '******** (leave to keep current)' : ''}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {GROUPS.filter(g => ['Moderation Alerts', 'Facebook & Instagram Integration'].includes(g.title)).map(group => (
                        <div key={group.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="font-bold text-gray-800 mb-1">{group.title}</h2>
                            {group.desc && <p className="text-xs text-gray-500 mb-4">{group.desc}</p>}
                            <div className="space-y-4">
                                {group.fields.map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{f.label}</label>
                                        {f.textarea ? (
                                            <textarea
                                                rows={2}
                                                value={values[f.key] ?? ''}
                                                onChange={e => onChange(f.key, e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        ) : (
                                            <input
                                                type={f.secret ? 'password' : 'text'}
                                                value={values[f.key] ?? ''}
                                                onChange={e => onChange(f.key, e.target.value)}
                                                placeholder={f.secret ? '******** (leave to keep current)' : ''}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
                {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>
        </div>
    );
}
