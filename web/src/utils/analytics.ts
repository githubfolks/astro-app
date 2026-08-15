// GA4 is installed via Google Tag Manager (see the GTM-WGS7TLDK snippet in
// index.html — that's the installation method specified in this account's
// Tag Manager, not a raw gtag.js include) — GTM owns window.dataLayer and
// boots the GA4 config tag itself. This just pushes SPA route changes into
// that same dataLayer as a custom event, for whatever trigger/tag GTM has
// configured to listen for it (GTM's container config lives on Google's
// side, not in this repo).

declare global {
    interface Window {
        dataLayer?: unknown[];
    }
}

export function trackPageView(path: string): void {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'page_view',
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
    });
}
