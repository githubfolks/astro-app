export const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

// Razorpay's checkout.js never reads any safe-area mechanism (env() or otherwise —
// confirmed by inspecting their shipped bundle), so its own "Pay/Continue" button
// sits flush against the bottom edge with no awareness of the Android gesture
// nav bar. It renders into a fixed-position `.razorpay-container` (see their
// bundle) appended straight to <body>, so we can pad that ourselves using the
// same --safe-area-inset-bottom value Capacitor's SystemBars plugin already
// injects (see index.css's .native-app safe-area vars) once it shows up.
//
// Confirmed via live devtools inspection that checkout.js creates this container
// (hidden, `display:none`) synchronously while the <script> itself is evaluating —
// i.e. before our `script.onload` fires and before any observer we attach after
// that point can see it. A MutationObserver alone therefore always misses the
// very first checkout open; only patch that one directly.
const patchIfPresent = (): boolean => {
    const container = document.querySelector<HTMLElement>('.razorpay-container');
    if (!container) return false;
    container.style.paddingBottom = 'var(--safe-area-bottom, 0px)';
    container.style.boxSizing = 'border-box';
    return true;
};

let razorpaySafeAreaObserver: MutationObserver | null = null;

export const patchRazorpaySafeArea = () => {
    if (patchIfPresent()) return;
    if (razorpaySafeAreaObserver) return;

    razorpaySafeAreaObserver = new MutationObserver(() => {
        patchIfPresent();
    });
    razorpaySafeAreaObserver.observe(document.body, { childList: true, subtree: true });
};
