import type { Batch } from '../types';

const minutesBetween = (startIso: string, endIso: string) =>
    Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);

const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
};

/** "1 hr 30 min" for a session's scheduled start/end. */
export const formatDuration = (startIso: string, endIso: string) => {
    const mins = minutesBetween(startIso, endIso);
    return mins > 0 ? formatMinutes(mins) : 'Invalid duration';
};

/** "Thu, 1 Oct 2026, 10:00 – 11:30" in the viewer's local time. */
export const formatSessionWhen = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const date = start.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const time = (d: Date) => d.toLocaleTimeString([], { timeStyle: 'short' });
    return `${date}, ${time(start)} – ${time(end)}`;
};

/** Class count, total teaching time, first class and seats left, derived from real batch data. */
export const summarizeBatch = (batch: Batch) => {
    const sessions = batch.sessions || [];
    const totalMinutes = sessions.reduce((sum, s) => sum + Math.max(0, minutesBetween(s.scheduled_start, s.scheduled_end)), 0);
    const startTimes = sessions.map((s) => new Date(s.scheduled_start).getTime());
    const now = Date.now();
    const firstStart = startTimes.length ? new Date(Math.min(...startTimes)).toISOString() : null;
    const upcoming = startTimes.filter((t) => t > now);
    const nextStart = upcoming.length ? new Date(Math.min(...upcoming)).toISOString() : null;
    const seatsLeft = batch.max_students != null && batch.seats_taken != null
        ? Math.max(0, batch.max_students - batch.seats_taken)
        : null;
    return {
        classCount: sessions.length,
        totalTime: totalMinutes > 0 ? formatMinutes(totalMinutes) : null,
        firstStart,
        /** Start of the next class that hasn't begun yet, if any. */
        nextStart,
        hasStarted: firstStart != null && new Date(firstStart).getTime() <= now,
        seatsLeft,
        isFull: seatsLeft === 0,
    };
};
