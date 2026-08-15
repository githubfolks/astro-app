// GA4 wiring, gated entirely by VITE_GA_MEASUREMENT_ID — no-ops (and never
// injects the gtag script) until that env var is set. See Analytics.tsx for
// the route-change hook that calls trackPageView.

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let initialized = false;

export function initGA(): void {
    if (initialized || !GA_MEASUREMENT_ID || typeof document === 'undefined') return;
    initialized = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer!.push(args);
    };
    window.gtag('js', new Date());
    // Suppress GA's automatic page_view on script load — SPA route changes
    // are tracked explicitly via trackPageView() instead, since gtag has no
    // way to see React Router navigations on its own.
    window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(path: string): void {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
    });
}
