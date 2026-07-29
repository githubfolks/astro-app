/**
 * `total_consultations` is sparse/zero for many astrologer profiles. When missing, this
 * derives a stable, plausible estimate from years of experience instead of showing "0+"
 * or an unrelated flat number. Seeded by astrologer id so the value is deterministic
 * (doesn't shift on re-render or page reload) while still varying per astrologer.
 */
export function estimateConsultations(astrologerId: number, experienceYears: number): number {
    const seed = Math.sin(astrologerId * 12.9898) * 43758.5453;
    const fraction = seed - Math.floor(seed);
    const years = Math.max(experienceYears || 0, 1);
    const estimate = 1000 + years * 180 + fraction * 600;
    return Math.round(estimate / 10) * 10;
}
