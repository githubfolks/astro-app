import type { SeekerProfile } from '../types';

/** Matches the "birth details" fields Dashboard.tsx prompts a seeker to fill in. */
export const isSeekerProfileComplete = (profile: SeekerProfile | null | undefined): boolean => {
    return !!(
        profile?.full_name &&
        profile?.date_of_birth &&
        profile?.time_of_birth &&
        profile?.place_of_birth &&
        profile?.gender
    );
};
