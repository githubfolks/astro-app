import React, { useEffect, useState } from 'react';
import SegmentSelect from './SegmentSelect';

interface DatePickerProps {
    id?: string;
    value: string; // "YYYY-MM-DD" or ""
    onChange: (value: string) => void;
    className: string;
    required?: boolean;
    /** "YYYY-MM-DD" — dates after this are not selectable */
    max?: string;
    /** "YYYY-MM-DD" — dates before this are not selectable */
    min?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => n.toString().padStart(2, '0');
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const parseDate = (value: string) => {
    const [y, m, d] = value ? value.split('-').map(Number) : [undefined, undefined, undefined];
    return { year: y || undefined, month: m || undefined, day: d || undefined };
};

const toIso = (year: number, month: number, day: number) =>
    `${year.toString().padStart(4, '0')}-${pad(month)}-${pad(day)}`;

/** Custom Day/Month/Year picker that replaces the OS-native `<input type="date">` widget. */
const DatePicker: React.FC<DatePickerProps> = ({ id, value, onChange, className, required, max, min }) => {
    const initial = parseDate(value);
    const [day, setDay] = useState(initial.day);
    const [month, setMonth] = useState(initial.month);
    const [year, setYear] = useState(initial.year);

    useEffect(() => {
        const computed = day && month && year ? toIso(year, month, day) : '';
        if (value !== computed) {
            const parsed = parseDate(value);
            setDay(parsed.day);
            setMonth(parsed.month);
            setYear(parsed.year);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const maxParts = max ? parseDate(max) : undefined;
    const minParts = min ? parseDate(min) : undefined;
    const currentYear = new Date().getFullYear();
    const maxYear = maxParts?.year ?? currentYear;
    const minYear = minParts?.year ?? currentYear - 120;

    const update = (nd: number | undefined, nm: number | undefined, ny: number | undefined) => {
        setDay(nd);
        setMonth(nm);
        setYear(ny);
        if (nd && nm && ny) {
            const clampedDay = Math.min(nd, daysInMonth(ny, nm));
            onChange(toIso(ny, nm, clampedDay));
        } else {
            onChange('');
        }
    };

    const maxDay = year && month ? daysInMonth(year, month) : 31;

    let maxMonth = 12;
    if (maxParts?.year && year === maxParts.year) maxMonth = maxParts.month ?? 12;
    let minMonth = 1;
    if (minParts?.year && year === minParts.year) minMonth = minParts.month ?? 1;

    let maxDayLimit = maxDay;
    if (maxParts?.year && maxParts.month && year === maxParts.year && month === maxParts.month) {
        maxDayLimit = Math.min(maxDayLimit, maxParts.day ?? maxDayLimit);
    }
    let minDayLimit = 1;
    if (minParts?.year && minParts.month && year === minParts.year && month === minParts.month) {
        minDayLimit = minParts.day ?? 1;
    }

    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) years.push(y);

    const months: number[] = [];
    for (let m = minMonth; m <= maxMonth; m++) months.push(m);

    const days: number[] = [];
    for (let d = minDayLimit; d <= maxDayLimit; d++) days.push(d);

    return (
        <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
            <SegmentSelect
                id={id}
                required={required}
                value={day}
                onChange={(d) => update(d, month, year)}
                options={days.map((d) => ({ value: d, label: String(d) }))}
                placeholder="Day"
                className={className}
            />
            <SegmentSelect
                required={required}
                value={month}
                onChange={(m) => update(day, m, year)}
                options={months.map((m) => ({ value: m, label: MONTHS[m - 1] }))}
                placeholder="Month"
                className={className}
            />
            <SegmentSelect
                required={required}
                value={year}
                onChange={(y) => update(day, month, y)}
                options={years.map((y) => ({ value: y, label: String(y) }))}
                placeholder="Year"
                className={className}
            />
        </div>
    );
};

export default DatePicker;
