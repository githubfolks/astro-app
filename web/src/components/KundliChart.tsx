import React from 'react';

/**
 * South Indian style Kundli chart component.
 * Renders a 4x4 grid with 12 outer cells representing the 12 houses.
 * 
 * House layout (South Indian):
 *  ┌────┬────┬────┬────┐
 *  │ 12 │  1 │  2 │  3 │
 *  ├────┼────┼────┼────┤
 *  │ 11 │         │  4 │
 *  ├────┤  Center  ├────┤
 *  │ 10 │         │  5 │
 *  ├────┼────┼────┼────┤
 *  │  9 │  8 │  7 │  6 │
 *  └────┴────┴────┴────┘
 */

interface Planet {
    name: string;
    shortName: string;
    house: number;
    retrograde?: boolean;
}

interface KundliChartProps {
    chartData: any; // Chart data from AstroAPI (d1, d9, etc.)
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

// South Indian chart: house positions in the 4x4 grid
// [row, col] for each house (0-indexed)
const HOUSE_POSITIONS: Record<number, [number, number]> = {
    12: [0, 0], 1: [0, 1], 2: [0, 2], 3: [0, 3],
    11: [1, 0], 4: [1, 3],
    10: [2, 0], 5: [2, 3],
    9: [3, 0], 8: [3, 1], 7: [3, 2], 6: [3, 3],
};

function extractPlanetsFromChart(chart: any): Planet[] {
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

function getRashiForHouse(chart: any, house: number): number | null {
    if (!chart) return null;
    const houseData = chart[house.toString()];
    if (houseData && houseData.rashi !== undefined) {
        return houseData.rashi;
    }
    return null;
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
    const cellSize = size / 4;
    const padding = 4;

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">{title}</h3>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="border border-gray-300 rounded-lg bg-[#FFFBF0]"
            >
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                    <React.Fragment key={`grid-${i}`}>
                        <line
                            x1={0} y1={i * cellSize}
                            x2={size} y2={i * cellSize}
                            stroke="#B8860B" strokeWidth={1.5}
                        />
                        <line
                            x1={i * cellSize} y1={0}
                            x2={i * cellSize} y2={size}
                            stroke="#B8860B" strokeWidth={1.5}
                        />
                    </React.Fragment>
                ))}

                {/* Center area diagonal lines */}
                <line
                    x1={cellSize} y1={cellSize}
                    x2={2 * cellSize} y2={2 * cellSize}
                    stroke="#B8860B" strokeWidth={1} strokeDasharray="4,4"
                />
                <line
                    x1={2 * cellSize} y1={cellSize}
                    x2={cellSize} y2={2 * cellSize}
                    stroke="#B8860B" strokeWidth={1} strokeDasharray="4,4"
                />
                <line
                    x1={2 * cellSize} y1={cellSize}
                    x2={3 * cellSize} y2={2 * cellSize}
                    stroke="#B8860B" strokeWidth={1} strokeDasharray="4,4"
                />
                <line
                    x1={3 * cellSize} y1={cellSize}
                    x2={2 * cellSize} y2={2 * cellSize}
                    stroke="#B8860B" strokeWidth={1} strokeDasharray="4,4"
                />
                <line
                    x1={cellSize} y1={2 * cellSize}
                    x2={2 * cellSize} y2={3 * cellSize}
                    stroke="#B8860B" strokeWidth={1} strokeDasharray="4,4"
                />
                <line
                    x1={2 * cellSize} y1={2 * cellSize}
                    x2={cellSize} y2={3 * cellSize}
                    stroke="#B8860B" strokeWidth={1} strokeDasharray="4,4"
                />
                <line
                    x1={2 * cellSize} y1={2 * cellSize}
                    x2={3 * cellSize} y2={3 * cellSize}
                    stroke="#B8860B" strokeWidth={1} strokeDasharray="4,4"
                />
                <line
                    x1={3 * cellSize} y1={2 * cellSize}
                    x2={2 * cellSize} y2={3 * cellSize}
                    stroke="#B8860B" strokeWidth={1} strokeDasharray="4,4"
                />

                {/* Center label */}
                <text
                    x={size / 2}
                    y={size / 2 - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight="bold"
                    fill="#8B4513"
                >
                    {title}
                </text>
                <text
                    x={size / 2}
                    y={size / 2 + 10}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#A0522D"
                >
                    (South Indian)
                </text>

                {/* House contents */}
                {Object.entries(HOUSE_POSITIONS).map(([houseStr, [row, col]]) => {
                    const house = parseInt(houseStr);
                    const x = col * cellSize;
                    const y = row * cellSize;
                    const rashi = getRashiForHouse(chartData, house);
                    const housePlanets = planets.filter(p => p.house === house);

                    return (
                        <g key={`house-${house}`}>
                            {/* Rashi name (small, top-left of cell) */}
                            {rashi !== null && (
                                <text
                                    x={x + padding + 2}
                                    y={y + 12}
                                    fontSize={8}
                                    fill="#999"
                                    fontWeight="500"
                                >
                                    {RASHI_NAMES[rashi]}
                                </text>
                            )}

                            {/* House number (small, top-right of cell) */}
                            <text
                                x={x + cellSize - padding - 2}
                                y={y + 12}
                                fontSize={8}
                                fill="#CCC"
                                textAnchor="end"
                            >
                                H{house}
                            </text>

                            {/* Planets */}
                            {housePlanets.map((planet, idx) => {
                                const planetX = x + padding + 6 + (idx % 3) * 28;
                                const planetY = y + 28 + Math.floor(idx / 3) * 18;
                                const color = PLANET_COLORS[planet.name] || '#333';

                                return (
                                    <text
                                        key={`${house}-${planet.name}`}
                                        x={planetX}
                                        y={planetY}
                                        fontSize={12}
                                        fontWeight="bold"
                                        fill={color}
                                    >
                                        {planet.shortName}
                                        {planet.retrograde && (
                                            <tspan fontSize={8} fill="#C62828">(R)</tspan>
                                        )}
                                    </text>
                                );
                            })}
                        </g>
                    );
                })}

                {/* Outer border */}
                <rect
                    x={0.5} y={0.5}
                    width={size - 1} height={size - 1}
                    fill="none"
                    stroke="#8B4513"
                    strokeWidth={2}
                    rx={8}
                />
            </svg>
        </div>
    );
};

export default KundliChart;
export { RASHI_NAMES, RASHI_NAMES_FULL, PLANET_SHORT, PLANET_COLORS };
