import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = API_URL.replace(/^http/, 'ws') + '/chat/ws';

export interface Message {
    id?: number;
    sender_id: number;
    content: string;
    timestamp: string;
    type?: 'MESSAGE' | 'SYSTEM';
}

export const useChat = (consultationId: string) => {
    const { token, user } = useAuth();
    const ws = useRef<WebSocket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<'CONNECTING' | 'ACTIVE' | 'ENDED' | 'PAUSED'>('CONNECTING');
    const [billingInfo, setBillingInfo] = useState({ balance: 0, spent: 0 });
    const [timerActive, setTimerActive] = useState(false);

    // Fetch History
    useEffect(() => {
        if (!token || !consultationId) return;

        const fetchHistory = async () => {
            try {
                const history = await api.consultations.getChatHistory(consultationId);
                const formattedHistory: Message[] = history.map((msg: any) => ({
                    id: msg.id,
                    sender_id: msg.sender_id,
                    content: msg.message,
                    timestamp: msg.timestamp,
                    type: 'MESSAGE'
                }));
                setMessages(formattedHistory);
            } catch (err) {
                console.error("Failed to fetch chat history:", err);
            }
        };

        fetchHistory();
    }, [consultationId, token]);

    useEffect(() => {
        if (!token || !consultationId || status === 'ENDED') return;

        const url = `${WS_URL}/${consultationId}?token=${token}`;
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            setStatus('ACTIVE');
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);


            switch (data.type) {
                case 'STATE_SYNC':
                    if (data.timer_active) setTimerActive(true);
                    setBillingInfo({ balance: data.balance, spent: data.spent });
                    if (data.status === 'COMPLETED' || data.status === 'AUTO_ENDED') setStatus('ENDED');
                    break;
                case 'NEW_MESSAGE':
                    setMessages(prev => {
                        // Avoid duplicates if polling and WS both working
                        if (prev.find(m => m.id === data.id)) return prev;
                        return [...prev, {
                            id: data.id,
                            sender_id: data.sender_id,
                            content: data.content,
                            timestamp: data.timestamp,
                            type: 'MESSAGE'
                        }];
                    });
                    break;
                case 'TIMER_STARTED':
                    setTimerActive(true);
                    break;
                case 'BALANCE_UPDATE':
                    setBillingInfo({ balance: data.balance, spent: data.spent });
                    break;
                case 'CHAT_ENDED':
                    setStatus('ENDED');
                    alert(`Chat Ended: ${data.reason}`);
                    break;
                case 'CONSULTATION_PAUSED':
                    setStatus('PAUSED');
                    setTimerActive(false);
                    // alert("Consultation Paused: " + data.reason);
                    break;
                default:
                    break;
            }
        };

        ws.current.onclose = () => {
            console.warn("WebSocket Closed. Switching to polling mode if not ended.");
            // We only set status to PAUSED if it was ACTIVE before. 
            // In polling mode, we might want to keep it ACTIVE but with a flag.
            setStatus(prev => prev === 'ENDED' ? 'ENDED' : 'ACTIVE'); 
        };

        ws.current.onerror = (err) => {
            console.error("WebSocket Error:", err);
            // Browser logs the connection failure, we handle fallback onclose
        };

        return () => {
            ws.current?.close();
        };
    }, [consultationId, token, status === 'ENDED']);

    // Polling Fallback
    useEffect(() => {
        if (!token || !consultationId || status === 'ENDED') return;
        
        // If WebSocket is active (OPEN), we don't need polling
        if (ws.current?.readyState === WebSocket.OPEN) return;

        const poll = async () => {
            try {
                // Fetch both history (for messages) AND current state (for status/billing)
                const [history, consultData] = await Promise.all([
                    api.consultations.getChatHistory(consultationId),
                    api.consultations.getOne(consultationId)
                ]);

                if (consultData.status === 'COMPLETED' || consultData.status === 'AUTO_ENDED') {
                    setStatus('ENDED');
                } else if (consultData.status === 'PAUSED') {
                    // Actual backend pause (e.g. astrologer disconnected but we are polling)
                    setTimerActive(false);
                } else if (consultData.status === 'ACTIVE') {
                    setTimerActive(true);
                }

                setBillingInfo({ 
                    balance: 0, // We could fetch this separately if needed, but for now we keep 0 or prev
                    spent: Number(consultData.total_cost || 0) 
                });

                const formattedHistory: Message[] = history.map((msg: any) => ({
                    id: msg.id,
                    sender_id: msg.sender_id,
                    content: msg.message,
                    timestamp: msg.timestamp,
                    type: 'MESSAGE'
                }));
                
                setMessages(prev => {
                    // Optimized check: only update if message count or content changed
                    if (prev.length === formattedHistory.length && 
                        prev[prev.length-1]?.id === formattedHistory[formattedHistory.length-1]?.id) {
                        return prev;
                    }
                    return formattedHistory;
                });
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        const interval = setInterval(poll, 4000);
        return () => clearInterval(interval);
    }, [consultationId, token, status, user?.role]);

    const sendMessage = async (content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'MESSAGE', content }));
        } else {
            // Fallback to HTTP POST
            try {
                await api.consultations.postMessage(consultationId, content);
                // The polling will pick it up, but for immediate feedback:
                // We fetch history immediately after sending to avoid delay
            } catch (err) {
                console.error("Failed to send message via fallback:", err);
            }
        }
    };

    const endChat = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'END_CHAT' }));
        }
    };

    return { messages, sendMessage, endChat, status, billingInfo, timerActive };
};
