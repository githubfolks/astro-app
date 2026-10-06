import React, { useEffect, useState } from 'react';
import { Bell, Share } from 'lucide-react';
import { enableWebPush, getWebPushSupport, syncWebPushSubscription } from '../services/fcm';
import { getErrorMessage } from '../utils/errors';

const DISMISS_KEY = 'web_push_home_screen_hint_dismissed';

type State = 'hidden' | 'needs-home-screen' | 'prompt' | 'denied';

const readDismissed = () => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
};

/**
 * Lets a browser astrologer turn on push notifications so new chat requests and
 * knocks reach them while the page is in the background — and so the backend
 * keeps them ONLINE for a grace period when the browser (notably iPhone Safari)
 * suspends the page. Renders nothing on native or once notifications work.
 */
const WebPushPrompt: React.FC = () => {
    const [state, setState] = useState<State>('hidden');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const support = getWebPushSupport();
        if (support === 'unsupported') return;
        if (support === 'needs-home-screen') {
            if (!readDismissed()) setState('needs-home-screen');
            return;
        }
        if (Notification.permission === 'denied') { setState('denied'); return; }
        if (Notification.permission === 'default') { setState('prompt'); return; }
        // Granted: make sure the backend has this browser's subscription.
        syncWebPushSubscription().then(token => {
            if (!cancelled) setState(token ? 'hidden' : 'prompt');
        });
        return () => { cancelled = true; };
    }, []);

    const onEnable = async () => {
        setBusy(true);
        setError(null);
        try {
            await enableWebPush();
            setState('hidden');
        } catch (e) {
            if (Notification.permission === 'denied') setState('denied');
            setError(getErrorMessage(e) || 'Could not enable notifications. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const onDismiss = () => {
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* storage blocked */ }
        setState('hidden');
    };

    if (state === 'hidden') return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Bell className="text-amber-600 flex-shrink-0" size={22} />
            <div className="flex-1 text-sm text-gray-800">
                {state === 'needs-home-screen' && (
                    <>
                        <p className="font-semibold">Get chat requests on your iPhone</p>
                        <p className="text-gray-600">
                            iPhone stops this page when you switch apps, so seekers see you as Offline.
                            Tap <Share size={14} className="inline -mt-0.5" /> <b>Share → Add to Home Screen</b>, open
                            Aadikarta from your Home Screen, and turn on notifications to stay reachable.
                        </p>
                    </>
                )}
                {state === 'prompt' && (
                    <>
                        <p className="font-semibold">Turn on notifications</p>
                        <p className="text-gray-600">Get new chat requests even when this page is in the background, and stay Online for seekers.</p>
                    </>
                )}
                {state === 'denied' && (
                    <>
                        <p className="font-semibold">Notifications are blocked</p>
                        <p className="text-gray-600">Allow notifications for this site in your browser settings to get new chat requests in the background.</p>
                    </>
                )}
                {error && <p className="text-red-600 mt-1">{error}</p>}
            </div>
            {state === 'prompt' && (
                <button
                    onClick={onEnable}
                    disabled={busy}
                    className="px-4 py-2 rounded-lg font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 flex-shrink-0"
                >
                    {busy ? 'Enabling…' : 'Enable notifications'}
                </button>
            )}
            {state === 'needs-home-screen' && (
                <button onClick={onDismiss} className="text-sm text-gray-500 underline flex-shrink-0">Dismiss</button>
            )}
        </div>
    );
};

export default WebPushPrompt;
