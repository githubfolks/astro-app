// GA4 is installed via Google Tag Manager (see the GTM-WGS7TLDK snippet in
// index.html — that's the installation method specified in this account's
// Tag Manager, not a raw gtag.js include) — GTM owns window.dataLayer and
// boots the GA4 config tag itself. This pushes SPA route changes and
// conversion events into that same dataLayer, for whatever trigger/tag GTM
// has configured to listen for them (GTM's container config lives on
// Google's side, not in this repo — see docs/ANALYTICS-EVENTS.md).
//
// Event names and parameters follow GA4's recommended-event schema:
// https://developers.google.com/analytics/devguides/collection/ga4/reference/events

declare global {
    interface Window {
        dataLayer?: unknown[];
    }
}

function push(payload: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
}

export function trackPageView(path: string): void {
    push({
        event: 'page_view',
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
    });
}

export type SignUpMethod = 'email' | 'google' | 'facebook';

/** A new account was created (email: once verified; social: first sign-in). */
export function trackSignUp(method: SignUpMethod): void {
    push({ event: 'sign_up', method });
}

/** A visitor handed over contact details (free report, callback request). No
 *  monetary value is sent: none of these leads has a real price attached. */
export function trackGenerateLead(leadSource: string): void {
    push({ event: 'generate_lead', lead_source: leadSource });
}

export interface WalletPurchase {
    /** Razorpay order id issued by our backend. */
    transactionId: string;
    /** Recharge amount excluding GST, in rupees, as computed by the backend. */
    value: number;
    /** GST charged on top of `value`, as computed by the backend. */
    tax: number;
    currency: string;
}

/** A wallet recharge whose payment the backend has verified. Call only after
 *  /payment/verify succeeds, with the amounts from the server-created order. */
export function trackWalletPurchase(p: WalletPurchase): void {
    // GTM ecommerce convention: clear the previous ecommerce object first so
    // fields from an earlier push can't leak into this one.
    push({ ecommerce: null });
    push({
        event: 'purchase',
        ecommerce: {
            transaction_id: p.transactionId,
            value: p.value,
            tax: p.tax,
            currency: p.currency,
            items: [{ item_id: 'wallet_recharge', item_name: 'Wallet Recharge', price: p.value, quantity: 1 }],
        },
    });
}
