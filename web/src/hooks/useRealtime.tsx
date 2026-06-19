import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = API_URL.replace(/^http/, 'ws') + '/realtime/ws';
const HEARTBEAT_INTERVAL_MS = 25_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export interface RealtimeEvent {
    type: string;
    consultation_id?: number;
    astrologer_id?: number;
    seeker_id?: number;
    reason?: string;
    [key: string]: unknown;
}

/**
 * Per-user realtime inbox: delivers NEW_REQUEST / QUEUE_UPDATE / YOUR_TURN /
 * ASTRO_ONLINE / MODERATION_ALERT / REQUEST_EXPIRED and keeps presence alive.
 * Pass a handler; it is called for every server event.
 */
export const useRealtime = (onEvent: (event: RealtimeEvent) => void) => {
    const { token } = useAuth();
    const ws = useRef<WebSocket | null>(null);
    const shouldReconnect = useRef(true);
    const reconnectAttempt = useRef(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const handlerRef = useRef(onEvent);
    useLayoutEffect(() => { handlerRef.current = onEvent; }, [onEvent]);

    const clearHeartbeat = () => {
        if (heartbeatTimer.current) { clearInterval(heartbeatTimer.current); heartbeatTimer.current = null; }
    };

    const connect = useCallback(() => {
        if (!token || !shouldReconnect.current) return;
        const socket = new WebSocket(`${WS_URL}?token=${token}`);
        ws.current = socket;

        socket.onopen = () => {
            reconnectAttempt.current = 0;
            clearHeartbeat();
            heartbeatTimer.current = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'PING' }));
            }, HEARTBEAT_INTERVAL_MS);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as RealtimeEvent;
                if (data.type === 'PONG') return;
                handlerRef.current(data);
            } catch { /* ignore malformed */ }
        };

        socket.onclose = () => {
            clearHeartbeat();
            if (!shouldReconnect.current) return;
            const delay = Math.min(1000 * 2 ** reconnectAttempt.current, MAX_RECONNECT_DELAY_MS);
            reconnectAttempt.current += 1;
            reconnectTimer.current = setTimeout(connect, delay);
        };

        socket.onerror = () => { /* onclose handles reconnect */ };
    }, [token]);

    useEffect(() => {
        shouldReconnect.current = true;
        connect();
        return () => {
            shouldReconnect.current = false;
            clearHeartbeat();
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            ws.current?.close();
        };
    }, [connect]);
};
