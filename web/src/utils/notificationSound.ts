/** Plays a short bell/ring chime for in-app realtime notifications (e.g. a new
 * consultation request arriving while the Dashboard is already open) —
 * separate from native push notification sound, which is configured
 * server-side in api/app/notifications.py and the Android notification
 * channel in MainActivity.java. */
let cached: HTMLAudioElement | null = null;

export function playNotificationSound() {
    try {
        if (!cached) {
            cached = new Audio('/sounds/notification-bell.wav');
        }
        // Rewind in case the previous ring is still playing/finishing.
        cached.currentTime = 0;
        void cached.play().catch(() => {
            // Autoplay can be blocked before the user has interacted with the
            // page at all — nothing meaningful to do about that here.
        });
    } catch {
        // Audio unsupported/unavailable — the visual notification still stands.
    }
}
