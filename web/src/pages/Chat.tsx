import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { Send, Clock } from 'lucide-react';

export const Chat: React.FC = () => {
    const { consultationId } = useParams<{ consultationId: string }>();
    const { messages, sendMessage, endChat, status, billingInfo, timerActive } = useChat(consultationId || '');
    const { user } = useAuth();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                {/* Chat Header */}
                <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                            <h2 className="font-bold">Astrology Consultation</h2>
                            <span className="text-xs text-gray-400">ID: {consultationId}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {timerActive ? (
                            <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-900">
                                <Clock size={16} />
                                <span className="font-mono">Timer Active</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-yellow-400 bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-900">
                                <Clock size={16} />
                                <span className="font-mono">Waiting to Start...</span>
                            </div>
                        )}

                        {user?.role === 'SEEKER' && (
                            <div className="text-sm">
                                <span className="text-gray-400">Spent:</span> ₹{billingInfo.spent}
                            </div>
                        )}

                        <button
                            onClick={() => { endChat(); navigate('/dashboard'); }}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold"
                        >
                            End Chat
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800/50">
                    {messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-3 rounded-xl ${isMe ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                    <p>{msg.content}</p>
                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="bg-gray-900 p-4 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 focus:outline-none focus:border-purple-500"
                        disabled={status === 'ENDED'}
                    />
                    <button
                        type="submit"
                        disabled={status === 'ENDED' || !input.trim()}
                        className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </Layout>
    );
};
