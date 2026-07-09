import type { DivisionChart } from '../types';
import React from 'react';
import { type Lang, RASHI_SHORT_HI, PLANET_SHORT_HI, UI_HI } from '../utils/kundliHindi';
import { isExalted, isDebilitated } from '../utils/planetDignity';

/**
 * North Indian style Kundli chart component.
 * Renders the traditional diamond-in-a-square layout: House 1 (Lagna) is
 * always the top point, and houses run clockwise from there (2, 3, 4 = right
 * point, ...). Which rashi (zodiac sign) falls in each house depends on the
 * ascendant, so — unlike the South Indian style — the rashi numbers move
 * from chart to chart while the house positions stay fixed.
 */

interface KundliChartProps {
    chartData?: DivisionChart; // A single division chart (D1, D9, D10, ...)
    title?: string;
    size?: number;
    lang?: Lang;
    // Cross-chart dignity markers (need data beyond a single division) — see planetDignity.ts.
    combustSet?: Set<string>;
    vargottamaSet?: Set<string>;
}

const RASHI_ABBR: Record<string, string> = {
    Aries: 'Ari', Taurus: 'Tau', Gemini: 'Gem', Cancer: 'Can',
    Leo: 'Leo', Virgo: 'Vir', Libra: 'Lib', Scorpio: 'Sco',
    Sagittarius: 'Sag', Capricorn: 'Cap', Aquarius: 'Aqu', Pisces: 'Pis',
};

// Planet display colors, keyed by lowercase planet name
const PLANET_COLORS: Record<string, string> = {
    sun: '#E65100',
    moon: '#1565C0',
    mars: '#C62828',
    mercury: '#2E7D32',
    jupiter: '#E65100',
    venus: '#6A1B9A',
    saturn: '#37474F',
    rahu: '#455A64',
    ketu: '#455A64',
};

const PLANET_SHORT: Record<string, string> = {
    sun: 'Su',
    moon: 'Mo',
    mars: 'Ma',
    mercury: 'Me',
    jupiter: 'Ju',
    venus: 'Ve',
    saturn: 'Sa',
    rahu: 'Ra',
    ketu: 'Ke',
};

/** Builds the 12 fixed house polygons for a North Indian chart inscribed in
 * a `size`x`size` square. See module doc for the geometry: an outer square,
 * its two corner-to-corner diagonals, and the diamond connecting the
 * midpoints of its sides together carve out exactly 12 regions. */
function buildHousePolygons(size: number) {
    const A: [number, number] = [0, 0];
    const B: [number, number] = [size, 0];
    const C: [number, number] = [size, size];
    const D: [number, number] = [0, size];
    const P: [number, number] = [size / 2, 0];       // top mid
    const Q: [number, number] = [size, size / 2];     // right mid
    const R: [number, number] = [size / 2, size];     // bottom mid
    const Sm: [number, number] = [0, size / 2];       // left mid
    const O: [number, number] = [size / 2, size / 2]; // center
    const X1: [number, number] = [size * 0.75, size * 0.75]; // mid of QR / CO
    const X2: [number, number] = [size * 0.25, size * 0.25]; // mid of SP / AO
    const X3: [number, number] = [size * 0.75, size * 0.25]; // mid of PQ / BO
    const X4: [number, number] = [size * 0.25, size * 0.75]; // mid of RS / DO

    return {
        1: [P, X3, O, X2],
        2: [B, P, X3],
        3: [B, Q, X3],
        4: [Q, X1, O, X3],
        5: [C, Q, X1],
        6: [C, R, X1],
        7: [R, X4, O, X1],
        8: [D, R, X4],
        9: [D, Sm, X4],
        10: [Sm, X2, O, X4],
        11: [A, Sm, X2],
        12: [A, P, X2],
    } as Record<number, [number, number][]>;
}

function centroid(points: [number, number][]): [number, number] {
    const n = points.length;
    const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
    return [sum[0] / n, sum[1] / n];
}

const KundliChart: React.FC<KundliChartProps> = ({
    chartData, title = 'Rashi Chart', size = 360, lang = 'en',
    combustSet, vargottamaSet,
}) => {
    if (!chartData || !chartData.houses || !chartData.planets) {
        return (
            <div className="flex items-center justify-center p-8 text-gray-400">
                <p>{lang === 'hi' ? UI_HI.noChartData : 'No chart data available'}</p>
            </div>
        );
    }

    const signByHouse: Record<number, { sign: string; signId: number }> = {};
    chartData.houses.forEach(h => { signByHouse[h.house] = { sign: h.sign, signId: h.sign_id }; });

    const housePolygons = buildHousePolygons(size);

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">{title}</h3>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="border border-gray-300 rounded-lg bg-[#FFFBF0]"
            >
                {/* Outer square */}
                <rect x={0.5} y={0.5} width={size - 1} height={size - 1} fill="none" stroke="#8B4513" strokeWidth={2} />

                {/* Diagonals */}
                <line x1={0} y1={0} x2={size} y2={size} stroke="#B8860B" strokeWidth={1.5} />
                <line x1={size} y1={0} x2={0} y2={size} stroke="#B8860B" strokeWidth={1.5} />

                {/* Diamond connecting side midpoints */}
                <polygon
                    points={`${size / 2},0 ${size},${size / 2} ${size / 2},${size} 0,${size / 2}`}
                    fill="none"
                    stroke="#B8860B"
                    strokeWidth={1.5}
                />

                {/* Center label */}
                <text
                    x={size / 2}
                    y={size / 2 - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="bold"
                    fill="#8B4513"
                >
                    {title}
                </text>
                <text
                    x={size / 2}
                    y={size / 2 + 9}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#A0522D"
                >
                    {lang === 'hi' ? '(उत्तर भारतीय)' : '(North Indian)'}
                </text>

                {/* House contents */}
                {Object.entries(housePolygons).map(([houseStr, points]) => {
                    const house = parseInt(houseStr);
                    const sign = signByHouse[house];
                    const housePlanets = chartData.planets.filter(p => p.house === house);
                    const [cx, cy] = centroid(points);

                    return (
                        <g key={`house-${house}`}>
                            {/* House number */}
                            <text
                                x={cx}
                                y={cy - (housePlanets.length > 0 ? 10 : 0)}
                                textAnchor="middle"
                                fontSize={9}
                                fill="#B8860B"
                                fontWeight="600"
                            >
                                {sign
                                    ? `${lang === 'hi' ? RASHI_SHORT_HI[sign.sign] || sign.sign : RASHI_ABBR[sign.sign] || sign.sign.substring(0, 3)}(${sign.signId})`
                                    : ''} · {lang === 'hi' ? UI_HI.house.charAt(0) : 'H'}{house}
                                {house === 1 && (lang === 'hi' ? ` (${UI_HI.lagna})` : ' (Asc)')}
                            </text>

                            {/* Planets */}
                            {housePlanets.map((planet, idx) => {
                                const col = idx % 2;
                                const row = Math.floor(idx / 2);
                                const px = cx + (col === 0 ? -12 : 12) * (housePlanets.length > 1 ? 1 : 0.3);
                                const py = cy + 8 + row * 14;
                                const key = planet.name.toLowerCase();
                                const color = PLANET_COLORS[key] || '#333';

                                const exalted = isExalted(planet.name, planet.sign);
                                const debilitated = isDebilitated(planet.name, planet.sign);
                                const combust = combustSet?.has(planet.name) ?? false;
                                const vargottama = vargottamaSet?.has(planet.name) ?? false;

                                return (
                                    <text
                                        key={`${house}-${planet.name}`}
                                        x={px}
                                        y={py}
                                        textAnchor="middle"
                                        fontSize={11}
                                        fontWeight="bold"
                                        fill={color}
                                    >
                                        {planet.degree_in_sign !== undefined && (
                                            <tspan x={px} dy={-9} fontSize={7} fontWeight="normal" fill="#999">
                                                {Math.floor(planet.degree_in_sign).toString().padStart(2, '0')}
                                            </tspan>
                                        )}
                                        <tspan x={px} dy={planet.degree_in_sign !== undefined ? 9 : 0}>
                                            {lang === 'hi' ? PLANET_SHORT_HI[key] || planet.name : PLANET_SHORT[key] || planet.name.substring(0, 2)}
                                        </tspan>
                                        {planet.is_retrograde && <tspan fontSize={8} fill="#C62828">*</tspan>}
                                        {combust && <tspan fontSize={8} fill="#B8860B">^</tspan>}
                                        {vargottama && <tspan fontSize={8} fill="#6A1B9A">□</tspan>}
                                        {exalted && <tspan fontSize={8} fill="#2E7D32">↑</tspan>}
                                        {debilitated && <tspan fontSize={8} fill="#C62828">↓</tspan>}
                                    </text>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default KundliChart;
export { RASHI_ABBR, PLANET_SHORT, PLANET_COLORS };
