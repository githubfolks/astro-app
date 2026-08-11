import { api } from './services/api';

// Caps how many crash reports one page-load will send. A tight render/retry
// loop could otherwise fire hundreds of identical reports before the user
// even notices something's wrong.
const MAX_REPORTS_PER_SESSION = 20;
let reportCount = 0;
const seenMessages = new Set<string>();

function report(source: 'js_error' | 'unhandled_rejection' | 'react_error_boundary', message: string, stack?: string) {
    const key = `${source}:${message}`;
    if (seenMessages.has(key) || reportCount >= MAX_REPORTS_PER_SESSION) return;
    seenMessages.add(key);
    reportCount++;

    api.clientErrors.report({
        source,
        message: message.slice(0, 2000),
        stack: stack?.slice(0, 8000),
        path: window.location.pathname,
    });
}

export function installGlobalErrorHandlers() {
    window.addEventListener('error', (event: ErrorEvent) => {
        report('js_error', event.message || 'Unknown error', event.error?.stack);
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        const stack = reason instanceof Error ? reason.stack : undefined;
        report('unhandled_rejection', message, stack);
    });
}

export function reportReactCrash(message: string, stack?: string) {
    report('react_error_boundary', message, stack);
}
