/** Extract a human-readable message from an unknown thrown value. */
export const getErrorMessage = (err: unknown): string | undefined => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null && 'message' in err) {
        const msg = (err as { message?: unknown }).message;
        if (typeof msg === 'string') return msg;
    }
    return undefined;
};

/** Read a numeric `status` field off an unknown thrown value, if present. */
export const getErrorStatus = (err: unknown): number | undefined => {
    if (typeof err === 'object' && err !== null && 'status' in err) {
        const status = (err as { status?: unknown }).status;
        if (typeof status === 'number') return status;
    }
    return undefined;
};
