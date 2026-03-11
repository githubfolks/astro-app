/**
 * Performance metrics utility using User Timing API
 */
export const perf = {
    mark(name: string) {
        if (typeof window !== 'undefined' && window.performance) {
            window.performance.mark(name);
        }
    },
    measure(name: string, startMark: string, endMark: string) {
        if (typeof window !== 'undefined' && window.performance) {
            try {
                window.performance.measure(name, startMark, endMark);
                const entries = window.performance.getEntriesByName(name);
                if (entries.length > 0) {
                    console.debug(`[Perf] ${name}: ${entries[0].duration.toFixed(2)}ms`);
                }
            } catch (e) {
                // Mark might not exist yet
            }
        }
    },
    clear() {
        if (typeof window !== 'undefined' && window.performance) {
            window.performance.clearMarks();
            window.performance.clearMeasures();
        }
    }
};
