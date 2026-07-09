import type { DivisionChart } from '../types';

/** Classical exaltation / debilitation signs for each graha. Rahu/Ketu follow
 * the widely-used software convention (Rahu exalted Taurus / debilitated
 * Scorpio, Ketu the mirror opposite) — traditions vary, but this matches
 * what tools like AstroSage / Jhora use. */
export const EXALTATION_SIGN: Record<string, string> = {
    Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo',
    Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra',
    Rahu: 'Taurus', Ketu: 'Scorpio',
};

export const DEBILITATION_SIGN: Record<string, string> = {
    Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces',
    Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries',
    Rahu: 'Scorpio', Ketu: 'Taurus',
};

export function isExalted(planetName: string, sign: string): boolean {
    return EXALTATION_SIGN[planetName] === sign;
}

export function isDebilitated(planetName: string, sign: string): boolean {
    return DEBILITATION_SIGN[planetName] === sign;
}

// Combustion orbs in degrees (classical values). Sun/Rahu/Ketu never combust.
const COMBUSTION_ORB: Record<string, number> = {
    Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15,
};
const COMBUSTION_ORB_RETROGRADE: Record<string, number> = {
    Mercury: 12, Venus: 8,
};

function angularDistance(a: number, b: number): number {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
}

/** Planets within their combustion orb of the Sun, computed from a chart that
 * has `absolute_degree` (only the D1 chart does — divisional charts don't
 * carry degree data, so this naturally returns empty for those). */
export function computeCombustSet(chart: DivisionChart | undefined): Set<string> {
    const combust = new Set<string>();
    if (!chart) return combust;
    const sun = chart.planets.find(p => p.name === 'Sun');
    if (!sun || sun.absolute_degree === undefined) return combust;

    for (const planet of chart.planets) {
        if (planet.name === 'Sun' || planet.name === 'Rahu' || planet.name === 'Ketu') continue;
        if (planet.absolute_degree === undefined) continue;
        const orb = (planet.is_retrograde && COMBUSTION_ORB_RETROGRADE[planet.name]) || COMBUSTION_ORB[planet.name];
        if (orb === undefined) continue;
        if (angularDistance(planet.absolute_degree, sun.absolute_degree) <= orb) {
            combust.add(planet.name);
        }
    }
    return combust;
}

/** Planets in the same sign in both D1 and D9 (Vargottama). */
export function computeVargottamaSet(d1: DivisionChart | undefined, d9: DivisionChart | undefined): Set<string> {
    const vargottama = new Set<string>();
    if (!d1 || !d9) return vargottama;
    const d9SignById: Record<string, number> = {};
    d9.planets.forEach(p => { d9SignById[p.name] = p.sign_id; });

    for (const planet of d1.planets) {
        if (d9SignById[planet.name] === planet.sign_id) {
            vargottama.add(planet.name);
        }
    }
    return vargottama;
}
