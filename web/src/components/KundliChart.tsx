import type { ChartDivision } from '../types';
import React from 'react';

/**
 * North Indian style Kundli chart component.
 * Renders the traditional diamond-in-a-square layout: House 1 (Lagna) is
 * always the top point, and houses run clockwise from there (2, 3, 4 = right
 * point, ...). Which rashi (zodiac sign) falls in each house depends on the
 * ascendant, so — unlike the South Indian style — the rashi numbers move
 * from chart to chart while the house positions stay fixed.
 */

interface Planet {
    name: string;
    shortName: string;
    house: number;
    retrograde?: boolean;
}

interface KundliChartProps {
    chartData?: ChartDivision; // A single chart division (D1, D9, etc.)
    title?: string;
    size?: number;
}

const RASHI_NAMES: Record<number, string> = {
    0: 'Ari', 1: 'Tau', 2: 'Gem', 3: 'Can', 4: 'Leo', 5: 'Vir',
    6: 'Lib', 7: 'Sco', 8: 'Sag', 9: 'Cap', 10: 'Aqu', 11: 'Pis',
};

const RASHI_NAMES_FULL: Record<number, string> = {
    0: 'Aries', 1: 'Taurus', 2: 'Gemini', 3: 'Cancer',
    4: 'Leo', 5: 'Virgo', 6: 'Libra', 7: 'Scorpio',
    8: 'Sagittarius', 9: 'Capricorn', 10: 'Aquarius', 11: 'Pisces',
};

// Planet display colors
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

function extractPlanetsFromChart(chart: ChartDivision): Planet[] {
    if (!chart) return [];

    const planets: Planet[] = [];

    // The chart format has houses "1" through "12" with {rashi, planets}
    for (let house = 1; house <= 12; house++) {
        const houseData = chart[house.toString()];
        if (houseData && houseData.planets && Array.isArray(houseData.planets)) {
            houseData.planets.forEach((planetName: string) => {
                planets.push({
                    name: planetName,
                    shortName: PLANET_SHORT[planetName] || planetName.substring(0, 2),
                    house: house,
                });
            });
        }
    }

    return planets;
}

function getRashiForHouse(chart: ChartDivision, house: number): number | null {
    if (!chart) return null;
    const houseData = chart[house.toString()];
    if (houseData && houseData.rashi !== undefined) {
        return houseData.rashi;
    }
    return null;
}

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

const KundliChart: React.FC<KundliChartProps> = ({ chartData, title = 'Rashi Chart', size = 360 }) => {
    if (!chartData) {
        return (
            <div className="flex items-center justify-center p-8 text-gray-400">
                <p>No chart data available</p>
            </div>
        );
    }

    const planets = extractPlanetsFromChart(chartData);
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
                    (North Indian)
                </text>

                {/* House contents */}
                {Object.entries(housePolygons).map(([houseStr, points]) => {
                    const house = parseInt(houseStr);
                    const rashi = getRashiForHouse(chartData, house);
                    const housePlanets = planets.filter(p => p.house === house);
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
                                {rashi !== null ? RASHI_NAMES[rashi] : ''} · H{house}
                            </text>

                            {/* Planets */}
                            {housePlanets.map((planet, idx) => {
                                const col = idx % 2;
                                const row = Math.floor(idx / 2);
                                const px = cx + (col === 0 ? -12 : 12) * (housePlanets.length > 1 ? 1 : 0.3);
                                const py = cy + 8 + row * 14;
                                const color = PLANET_COLORS[planet.name] || '#333';

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
                                        {planet.shortName}
                                        {planet.retrograde && (
                                            <tspan fontSize={7} fill="#C62828">(R)</tspan>
                                        )}
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
export { RASHI_NAMES, RASHI_NAMES_FULL, PLANET_SHORT, PLANET_COLORS };
