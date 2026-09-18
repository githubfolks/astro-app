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

/** Read the structured `code` api.ts attaches to errors with an object-shaped `detail`. */
export const getErrorCode = (err: unknown): string | undefined => {
    if (typeof err === 'object' && err !== null && 'code' in err) {
        const code = (err as { code?: unknown }).code;
        if (typeof code === 'string') return code;
    }
    return undefined;
};

/** Read the `consultationId` api.ts attaches to an ACTIVE_CONSULTATION_EXISTS error. */
export const getErrorConsultationId = (err: unknown): number | undefined => {
    if (typeof err === 'object' && err !== null && 'consultationId' in err) {
        const id = (err as { consultationId?: unknown }).consultationId;
        if (typeof id === 'number') return id;
    }
    return undefined;
};
