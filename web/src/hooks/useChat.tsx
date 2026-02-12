import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    const { token } = useAuth();
    const ws = useRef<WebSocket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<'CONNECTING' | 'ACTIVE' | 'ENDED' | 'PAUSED'>('CONNECTING');
    const [billingInfo, setBillingInfo] = useState({ balance: 0, spent: 0 });
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        if (!token || !consultationId) return;

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
                    setMessages(prev => [...prev, {
                        id: data.id,
                        sender_id: data.sender_id,
                        content: data.content,
                        timestamp: data.timestamp,
                        type: 'MESSAGE'
                    }]);
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
                    alert("Consultation Paused: " + data.reason);
                    break;
                default:
                    break;
            }
        };

        ws.current.onclose = () => {

            if (status !== 'ENDED') setStatus('PAUSED');
        };

        return () => {
            ws.current?.close();
        };
    }, [consultationId, token]);

    const sendMessage = (content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'MESSAGE', content }));
        }
    };

    const endChat = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'END_CHAT' }));
        }
    };

    return { messages, sendMessage, endChat, status, billingInfo, timerActive };
};
