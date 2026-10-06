/*
 * Web Push handlers, pulled into the Workbox-generated service worker via
 * VitePWA's workbox.importScripts (see vite.config.ts). The backend sends a
 * JSON payload { title, body, data } — see api/app/notifications.py.
 */

// Mirrors the native pushNotificationActionPerformed routing in App.tsx.
function targetUrlFor(data) {
    if (data && (data.type === 'KNOCK' || data.type === 'NEW_REQUEST')) return '/dashboard';
    if (data && data.consultation_id) return '/chat/' + encodeURIComponent(data.consultation_id);
    return '/';
}

self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (e) {
        payload = { body: event.data ? event.data.text() : '' };
    }
    const title = payload.title || 'Aadikarta';
    event.waitUntil(
        self.registration.showNotification(title, {
            body: payload.body || '',
            icon: '/apple-touch-icon.png',
            badge: '/apple-touch-icon.png',
            data: payload.data || {},
            // A newer request/knock replaces an older one instead of stacking.
            tag: payload.data && payload.data.type ? payload.data.type : undefined,
            renotify: true,
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = targetUrlFor(event.notification.data);
    event.waitUntil((async () => {
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of windows) {
            if ('focus' in client) {
                await client.focus();
                if ('navigate' in client) {
                    try { await client.navigate(url); } catch (e) { /* cross-origin/uncontrolled */ }
                }
                return;
            }
        }
        await self.clients.openWindow(url);
    })());
});
