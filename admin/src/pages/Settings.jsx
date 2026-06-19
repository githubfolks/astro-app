import React, { useEffect, useState } from 'react';
import { settings as settingsApi } from '../services/api';
import { Button } from '../components/ui/Button';

const GROUPS = [
    {
        title: 'WhatsApp Gateway (wa.aavyalabtech.com)',
        desc: 'System sends WhatsApp alerts to astrologers on new requests and to admin on moderation flags.',
        fields: [
            { key: 'wa_base_url', label: 'Gateway Base URL' },
            { key: 'wa_api_key', label: 'API Key', secret: true },
            { key: 'wa_sender', label: 'Sender Number / Session ID' },
            { key: 'wa_template_new_request', label: 'Template: New Request', textarea: true },
            { key: 'wa_template_your_turn', label: 'Template: Your Turn', textarea: true },
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
];

export default function Settings() {
    const [values, setValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

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

    return (
        <div className="p-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Platform Settings</h1>
            <p className="text-gray-500 mb-6 text-sm">Configure WhatsApp notifications, moderation alerts and system tunables.</p>

            {GROUPS.map(group => (
                <div key={group.title} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
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
                                        type={f.secret ? 'text' : 'text'}
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

            <div className="flex items-center gap-4">
                <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
                {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>
        </div>
    );
}
