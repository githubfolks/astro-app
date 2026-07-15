import { useEffect, useState } from 'react';
import { api } from '../services/api';

// Fallback used only until the /public/support-contact fetch resolves (or if it fails),
// so pages never render with a blank contact field.
const FALLBACK = { support_email: 'support@aadikarta.org', support_phone: '' };

let cached: { support_email: string, support_phone: string } | null = null;
let inFlight: Promise<{ support_email: string, support_phone: string }> | null = null;

/** Support email/phone as configured in Admin > Settings > Support Contact. */
export function useSupportContact() {
    const [contact, setContact] = useState(cached ?? FALLBACK);

    useEffect(() => {
        if (cached) return;
        if (!inFlight) {
            inFlight = api.cms.getSupportContact().catch(() => FALLBACK);
        }
        inFlight.then((data) => {
            cached = data;
            setContact(data);
        });
    }, []);

    return contact;
}
