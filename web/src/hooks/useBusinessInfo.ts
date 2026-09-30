import { useEffect, useState } from 'react';
import { api, type BusinessInfo } from '../services/api';

let cached: BusinessInfo | null = null;
let inFlight: Promise<BusinessInfo | null> | null = null;

/**
 * Legal entity, grievance officer and GST rate as configured in
 * Admin > Settings > Business & Legal. `info` is null while loading or if the
 * fetch failed — callers must not invent values in that case.
 */
export function useBusinessInfo() {
    const [info, setInfo] = useState<BusinessInfo | null>(cached);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (cached) return;
        if (!inFlight) {
            inFlight = api.cms.getBusinessInfo().catch(() => null);
        }
        inFlight.then((data) => {
            if (data) {
                cached = data;
                setInfo(data);
            } else {
                inFlight = null; // allow a retry on the next mount
                setError(true);
            }
        });
    }, []);

    return { info, error };
}
