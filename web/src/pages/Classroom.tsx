import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Classroom.css';

export const Classroom: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomUrl, setRoomUrl] = useState<string | null>(null);

    useEffect(() => {
        const join = async () => {
            if (!sessionId) return;
            try {
                setLoading(true);
                const data = await api.edu.joinSession(parseInt(sessionId));
                setRoomUrl(data.room_url);
            } catch (err: any) {
                console.error("Failed to join classroom:", err);
                setError(err.message || "Failed to join the classroom. Please ensure you are enrolled and the class has started.");
            } finally {
                setLoading(false);
            }
        };

        join();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="classroom-loading">
                <div className="spinner"></div>
                <p>Securing your connection to the classroom...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="classroom-error">
                <h2>Access Denied</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/dashboard')} className="back-btn">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="classroom-container">
            <div className="classroom-header">
                <button onClick={() => navigate(-1)} className="exit-btn">
                    <span>&larr;</span> Exit Class
                </button>
                <h1>Live Video Class</h1>
            </div>
            <div className="classroom-frame-wrapper">
                {roomUrl && (
                    <iframe
                        src={roomUrl}
                        allow="camera; microphone; display-capture; autoplay; clipboard-write"
                        className="mirotalk-iframe"
                        title="MiroTalk Classroom"
                    />
                )}
            </div>
        </div>
    );
};

export default Classroom;
