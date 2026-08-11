import React, { useEffect, useState } from 'react';
import SegmentSelect from './SegmentSelect';

interface TimePickerProps {
    id?: string;
    value: string; // "HH:MM" or "HH:MM:SS" (24-hour) or ""
    onChange: (value: string) => void;
    className: string;
    required?: boolean;
    /** Include a seconds column and emit "HH:MM:SS" instead of "HH:MM" */
    withSeconds?: boolean;
}

const pad = (n: number) => n.toString().padStart(2, '0');

const parseTime = (value: string) => {
    const [h, m, s] = value ? value.split(':').map(Number) : [undefined, undefined, undefined];
    return {
        hour: h !== undefined && !Number.isNaN(h) ? h : undefined,
        minute: m !== undefined && !Number.isNaN(m) ? m : undefined,
        second: s !== undefined && !Number.isNaN(s) ? s : undefined,
    };
};

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Custom Hour/Minute[/Second] picker that replaces the OS-native `<input type="time">` widget. */
const TimePicker: React.FC<TimePickerProps> = ({ id, value, onChange, className, required, withSeconds }) => {
    const initial = parseTime(value);
    const [hour, setHour] = useState(initial.hour);
    const [minute, setMinute] = useState(initial.minute);
    const [second, setSecond] = useState(withSeconds ? initial.second : undefined);

    useEffect(() => {
        const complete = hour !== undefined && minute !== undefined && (!withSeconds || second !== undefined);
        const computed = complete
            ? withSeconds
                ? `${pad(hour!)}:${pad(minute!)}:${pad(second!)}`
                : `${pad(hour!)}:${pad(minute!)}`
            : '';
        if (value !== computed) {
            const parsed = parseTime(value);
            setHour(parsed.hour);
            setMinute(parsed.minute);
            setSecond(withSeconds ? parsed.second : undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const update = (nh: number | undefined, nm: number | undefined, ns: number | undefined) => {
        setHour(nh);
        setMinute(nm);
        setSecond(ns);
        const complete = nh !== undefined && nm !== undefined && (!withSeconds || ns !== undefined);
        if (complete) {
            onChange(withSeconds ? `${pad(nh!)}:${pad(nm!)}:${pad(ns!)}` : `${pad(nh!)}:${pad(nm!)}`);
        } else {
            onChange('');
        }
    };

    return (
        <div className={withSeconds ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2'}>
            <SegmentSelect
                id={id}
                required={required}
                value={hour}
                onChange={(h) => update(h, minute, second)}
                options={range(24).map((h) => ({ value: h, label: pad(h) }))}
                placeholder="HH"
                className={className}
            />
            <SegmentSelect
                required={required}
                value={minute}
                onChange={(m) => update(hour, m, second)}
                options={range(60).map((m) => ({ value: m, label: pad(m) }))}
                placeholder="MM"
                className={className}
            />
            {withSeconds && (
                <SegmentSelect
                    required={required}
                    value={second}
                    onChange={(s) => update(hour, minute, s)}
                    options={range(60).map((s) => ({ value: s, label: pad(s) }))}
                    placeholder="SS"
                    className={className}
                />
            )}
        </div>
    );
};

export default TimePicker;
