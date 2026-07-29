import type { DashaPeriod } from '../types';

// Fixed Vimshottari Mahadasha order and each planet's dasha-years (sums to 120).
// The same proportional-subdivision rule that turns a Mahadasha into 9 Antardashas,
// and an Antardasha into 9 Pratyantardashas, applies at every deeper level too —
// so it can be reused to derive Sukshma and Prana dasha, which FreeAstroAPI doesn't
// compute (it hard-caps at Pratyantardasha / level 3).
const VIMSHOTTARI_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const VIMSHOTTARI_YEARS: Record<string, number> = {
    Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};
const TOTAL_YEARS = 120;
const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;

function addYears(date: Date, years: number): Date {
    return new Date(date.getTime() + years * MS_PER_YEAR);
}

function toDateOnlyString(date: Date): string {
    return date.toISOString().slice(0, 10);
}

interface RawSubPeriod {
    lord: string;
    start: Date;
    end: Date;
    duration_years: number;
    path: string[];
}

/** Splits [start, start+durationYears) into 9 sub-periods cycling the fixed
 * Vimshottari order starting from `lord`, each sized proportional to that
 * planet's dasha-years out of 120. */
function subdivide(start: Date, durationYears: number, lord: string, parentPath: string[]): RawSubPeriod[] {
    const startIdx = VIMSHOTTARI_ORDER.indexOf(lord);
    if (startIdx === -1) return [];
    let cursor = start;
    const periods: RawSubPeriod[] = [];
    for (let i = 0; i < 9; i++) {
        const planet = VIMSHOTTARI_ORDER[(startIdx + i) % 9];
        const years = durationYears * (VIMSHOTTARI_YEARS[planet] / TOTAL_YEARS);
        const end = addYears(cursor, years);
        periods.push({ lord: planet, start: cursor, end, duration_years: years, path: [...parentPath, planet] });
        cursor = end;
    }
    return periods;
}

function toDashaPeriod(level: 'Sukshma' | 'Prana', period: RawSubPeriod, nowMs: number): DashaPeriod {
    const elapsedYears = Math.max(0, (nowMs - period.start.getTime()) / MS_PER_YEAR);
    const remainingYears = Math.max(0, period.duration_years - elapsedYears);
    return {
        level,
        lord: period.lord,
        start: toDateOnlyString(period.start),
        end: toDateOnlyString(period.end),
        duration_years: period.duration_years,
        elapsed_years: elapsedYears,
        remaining_years: remainingYears,
        progress_fraction: period.duration_years > 0 ? Math.min(elapsedYears / period.duration_years, 1) : 0,
        path: period.path,
    };
}

/**
 * Derives the currently-active Sukshma (level 4) and Prana (level 5) dasha from
 * the API-provided active Pratyantardasha, using the classical Vimshottari
 * proportional-subdivision rule. "Now" is anchored to the Pratyantardasha's own
 * elapsed_years (not the wall clock) so it stays consistent with whatever
 * reference date the rest of the chart was generated against.
 */
export function computeActiveSukshmaAndPrana(pratyantardasha: DashaPeriod): { sukshma: DashaPeriod; prana: DashaPeriod } | null {
    const start = new Date(`${pratyantardasha.start}T00:00:00Z`);
    if (Number.isNaN(start.getTime())) return null;

    const nowMs = start.getTime() + pratyantardasha.elapsed_years * MS_PER_YEAR;

    const sukshmaPeriods = subdivide(start, pratyantardasha.duration_years, pratyantardasha.lord, pratyantardasha.path);
    if (sukshmaPeriods.length === 0) return null;
    const activeSukshma = sukshmaPeriods.find(p => nowMs < p.end.getTime()) || sukshmaPeriods[sukshmaPeriods.length - 1];

    const pranaPeriods = subdivide(activeSukshma.start, activeSukshma.duration_years, activeSukshma.lord, activeSukshma.path);
    if (pranaPeriods.length === 0) return null;
    const activePrana = pranaPeriods.find(p => nowMs < p.end.getTime()) || pranaPeriods[pranaPeriods.length - 1];

    return {
        sukshma: toDashaPeriod('Sukshma', activeSukshma, nowMs),
        prana: toDashaPeriod('Prana', activePrana, nowMs),
    };
}
