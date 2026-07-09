import type { ChatHistoryItem } from '../types';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = API_URL.replace(/^http/, 'ws') + '/chat/ws';
const HEARTBEAT_INTERVAL_MS = 25_000;
const PONG_TIMEOUT_MS = 10_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export interface Message {
    id?: number;
    sender_id: number;
    content: string;
    timestamp: string;
    type?: 'MESSAGE' | 'SYSTEM';
}

export const useChat = (consultationId: string) => {
    const { token } = useAuth();
    const ws = useRef<WebSocket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<'CONNECTING' | 'ACTIVE' | 'ENDED' | 'PAUSED'>('CONNECTING');
    const [pauseReason, setPauseReason] = useState<string | null>(null);
    const [billingInfo, setBillingInfo] = useState({ balance: 0, spent: 0, minutes_remaining: 0 });
    const [timerActive, setTimerActive] = useState(false);
    const [talkTimeSeconds, setTalkTimeSeconds] = useState(0);
    const [lowBalance, setLowBalance] = useState(false);
    const [moderationAlert, setModerationAlert] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [endedReason, setEndedReason] = useState<string | null>(null);

    // Reconnection state
    const shouldReconnect = useRef(true);
    const reconnectAttempt = useRef(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Heartbeat state
    const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const pongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastPongReceived = useRef(true);

    const clearHeartbeat = useCallback(() => {
        if (heartbeatTimer.current) { clearInterval(heartbeatTimer.current); heartbeatTimer.current = null; }
        if (pongTimer.current) { clearTimeout(pongTimer.current); pongTimer.current = null; }
    }, []);

    const startHeartbeat = useCallback((socket: WebSocket) => {
        clearHeartbeat();
        heartbeatTimer.current = setInterval(() => {
            if (socket.readyState !== WebSocket.OPEN) return;
            lastPongReceived.current = false;
            socket.send(JSON.stringify({ type: 'PING' }));
            pongTimer.current = setTimeout(() => {
                if (!lastPongReceived.current) {
                    console.warn('Heartbeat PONG timeout — reconnecting');
                    socket.close(4001, 'heartbeat_timeout');
                }
            }, PONG_TIMEOUT_MS);
        }, HEARTBEAT_INTERVAL_MS);
    }, [clearHeartbeat]);

    const connect = useCallback(() => {
        if (!token || !consultationId || !shouldReconnect.current) return;

        const url = `${WS_URL}/${consultationId}?token=${token}`;
        const socket = new WebSocket(url);
        ws.current = socket;

        socket.onopen = () => {
            reconnectAttempt.current = 0;
            startHeartbeat(socket);
            setStatus(prev => (prev === 'ENDED' || prev === 'PAUSED') ? prev : 'CONNECTING');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'PONG':
                    lastPongReceived.current = true;
                    if (pongTimer.current) { clearTimeout(pongTimer.current); pongTimer.current = null; }
                    break;
                case 'STATE_SYNC':
                    if (data.timer_active) setTimerActive(true);
                    setBillingInfo({ balance: data.balance, spent: data.spent, minutes_remaining: data.minutes_remaining ?? 0 });
                    setTalkTimeSeconds(data.duration_seconds ?? 0);
                    if (data.status === 'COMPLETED' || data.status === 'AUTO_ENDED') { setStatus('ENDED'); setTimerActive(false); }
                    else if (data.status === 'PAUSED') setStatus('PAUSED');
                    else if (data.status === 'ACTIVE') setStatus('ACTIVE');
                    break;
                case 'NEW_MESSAGE':
                    setMessages(prev => {
                        if (prev.find(m => m.id === data.id)) return prev;
                        return [...prev, { id: data.id, sender_id: data.sender_id, content: data.content, timestamp: data.timestamp, type: 'MESSAGE' }];
                    });
                    break;
                case 'TIMER_STARTED':
                    setTimerActive(true);
                    setStatus('ACTIVE');
                    break;
                case 'BALANCE_UPDATE':
                    setBillingInfo({ balance: data.balance, spent: data.spent, minutes_remaining: data.minutes_remaining ?? 0 });
                    if (data.duration_seconds !== undefined) setTalkTimeSeconds(data.duration_seconds);
                    if (data.minutes_remaining > 5) setLowBalance(false);
                    break;
                case 'BALANCE_WARNING':
                    setLowBalance(true);
                    break;
                case 'CHAT_ENDED':
                    shouldReconnect.current = false;
                    setStatus('ENDED');
                    setTimerActive(false);
                    setEndedReason(data.reason ?? null);
                    break;
                case 'CONSULTATION_PAUSED':
                    setStatus('PAUSED');
                    setTimerActive(false);
                    setPauseReason(data.reason ?? null);
                    break;
                case 'CONSULTATION_RESUMED':
                    setStatus('ACTIVE');
                    setTimerActive(true);
                    setLowBalance(false);
                    setPauseReason(null);
                    if (data.balance !== undefined) {
                        setBillingInfo(prev => ({ ...prev, balance: data.balance }));
                    }
                    break;
                case 'RESUME_FAILED':
                    break;
                case 'MODERATION_ALERT':
                    setModerationAlert(data.message || 'Sharing personal contact details is not allowed. This chat is monitored.');
                    break;
                case 'ERROR':
                    setSessionError(data.message || 'Something went wrong.');
                    break;
                default:
                    break;
            }
        };

        socket.onclose = (event) => {
            clearHeartbeat();
            console.warn(`WebSocket closed (code=${event.code})`);

            // Normal closure or consultation ended — don't reconnect
            if (event.code === 1000 || !shouldReconnect.current) {
                setStatus(prev => (prev === 'ENDED' || prev === 'PAUSED') ? prev : 'PAUSED');
                return;
            }

            setStatus(prev => (prev === 'ENDED' || prev === 'PAUSED') ? prev : 'PAUSED');

            // Exponential backoff: 1s, 2s, 4s, 8s, ... capped at 30s
            const delay = Math.min(1000 * 2 ** reconnectAttempt.current, MAX_RECONNECT_DELAY_MS);
            reconnectAttempt.current += 1;
            console.info(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt.current})`);
            reconnectTimer.current = setTimeout(connect, delay);
        };

        socket.onerror = () => {
            // onclose fires immediately after, which handles reconnect
        };
    }, [consultationId, token, startHeartbeat, clearHeartbeat]);

    // Tick the talk-time clock locally between server duration syncs
    useEffect(() => {
        if (!timerActive) return;
        const interval = setInterval(() => setTalkTimeSeconds(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [timerActive]);

    // Fetch History
    useEffect(() => {
        if (!token || !consultationId) return;
        api.consultations.getChatHistory(consultationId).then((history: ChatHistoryItem[]) => {
            setMessages(history.map(msg => ({
                id: msg.id,
                sender_id: msg.sender_id,
                content: msg.message,
                timestamp: msg.timestamp,
                type: 'MESSAGE' as const
            })));
        }).catch(console.error);
    }, [consultationId, token]);

    // Connect on mount
    useEffect(() => {
        if (!token || !consultationId) return;
        shouldReconnect.current = true;
        connect();
        return () => {
            shouldReconnect.current = false;
            clearHeartbeat();
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            ws.current?.close(1000, 'component_unmount');
        };
    }, [connect, consultationId, token, clearHeartbeat]);

    // Backgrounding a tab/screen freezes the heartbeat timer and the OS often drops
    // the underlying socket outright, so by the time the tab is foregrounded again
    // the connection is already dead — reconnect immediately instead of waiting out
    // whatever exponential-backoff delay (up to 30s) happened to be in flight.
    useEffect(() => {
        const tryReconnectNow = () => {
            if (!shouldReconnect.current) return;
            const state = ws.current?.readyState;
            if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
            if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
            reconnectAttempt.current = 0;
            connect();
        };

        const onVisibilityChange = () => { if (document.visibilityState === 'visible') tryReconnectNow(); };
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('online', tryReconnectNow);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('online', tryReconnectNow);
        };
    }, [connect]);

    const sendMessage = async (content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'MESSAGE', content }));
        } else {
            try {
                await api.consultations.postMessage(consultationId, content);
            } catch (err) {
                console.error('Failed to send message via fallback:', err);
            }
        }
    };

    const endChat = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            shouldReconnect.current = false;
            ws.current.send(JSON.stringify({ type: 'END_CHAT' }));
        }
    };

    const resumeChat = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'RESUME_CHAT' }));
        } else {
            api.consultations.resumeConsultation(consultationId).catch(err => {
                console.error('Failed to resume consultation via REST:', err);
            });
        }
    };

    return {
        messages, sendMessage, endChat, resumeChat, status, pauseReason,
        billingInfo, timerActive, lowBalance, talkTimeSeconds,
        moderationAlert, dismissModerationAlert: () => setModerationAlert(null),
        sessionError, dismissSessionError: () => setSessionError(null),
        endedReason,
    };
};
