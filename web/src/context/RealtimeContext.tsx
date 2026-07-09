import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

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

type Listener = (event: RealtimeEvent) => void;

const RealtimeContext = createContext<{ subscribe: (listener: Listener) => () => void } | null>(null);

/**
 * Owns the single /realtime/ws connection for the whole authenticated session
 * (mounted once in App.tsx, not per-page). Its heartbeat PINGs are what keep an
 * astrologer's Redis presence key alive, which drives availability_status on the
 * backend — a page-scoped socket used to drop the moment an astrologer navigated
 * off the Dashboard into a chat, flipping them OFFLINE for every other seeker
 * mid-conversation.
 */
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const ws = useRef<WebSocket | null>(null);
    const shouldReconnect = useRef(true);
    const reconnectAttempt = useRef(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const listeners = useRef<Set<Listener>>(new Set());

    const clearHeartbeat = () => {
        if (heartbeatTimer.current) { clearInterval(heartbeatTimer.current); heartbeatTimer.current = null; }
    };

    const connect = useCallback((currentToken: string) => {
        if (!shouldReconnect.current) return;
        const socket = new WebSocket(`${WS_URL}?token=${currentToken}`);
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
                listeners.current.forEach(l => l(data));
            } catch { /* ignore malformed */ }
        };

        socket.onclose = () => {
            clearHeartbeat();
            if (!shouldReconnect.current) return;
            const delay = Math.min(1000 * 2 ** reconnectAttempt.current, MAX_RECONNECT_DELAY_MS);
            reconnectAttempt.current += 1;
            reconnectTimer.current = setTimeout(() => connect(currentToken), delay);
        };

        socket.onerror = () => { /* onclose handles reconnect */ };
    }, []);

    useEffect(() => {
        if (!token) {
            shouldReconnect.current = false;
            clearHeartbeat();
            if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
            ws.current?.close();
            return;
        }

        shouldReconnect.current = true;
        reconnectAttempt.current = 0;
        connect(token);

        return () => {
            shouldReconnect.current = false;
            clearHeartbeat();
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            ws.current?.close();
        };
    }, [token, connect]);

    const subscribe = useCallback((listener: Listener) => {
        listeners.current.add(listener);
        return () => { listeners.current.delete(listener); };
    }, []);

    return (
        <RealtimeContext.Provider value={{ subscribe }}>
            {children}
        </RealtimeContext.Provider>
    );
};

/**
 * Subscribe to realtime server events (NEW_REQUEST, QUEUE_UPDATE, ASTRO_ONLINE,
 * ASTRO_OFFLINE, ...) without opening a new socket — the connection lives in
 * RealtimeProvider for the whole authenticated session, so it survives
 * navigation between pages.
 */
export const useRealtime = (onEvent: Listener) => {
    const ctx = useContext(RealtimeContext);
    const handlerRef = useRef(onEvent);
    useEffect(() => { handlerRef.current = onEvent; }, [onEvent]);

    useEffect(() => {
        if (!ctx) return;
        return ctx.subscribe((event) => handlerRef.current(event));
    }, [ctx]);
};
