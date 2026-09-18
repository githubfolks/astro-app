import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Same set the server treats as "already have an active consultation" —
// see blocking_statuses in api/app/routers/consultations.py.
const BLOCKING_STATUSES = ['REQUESTED', 'ACCEPTED', 'ACTIVE', 'PAUSED'];
const POLL_INTERVAL_MS = 30_000;

interface ActiveConsultation {
    id: number;
    status: string;
}

// Persistent reminder, shown on every page (via Header) while a seeker has a
// live consultation running elsewhere — so navigating away and tapping "Chat"
// on another astrologer doesn't silently spin up a second session.
const ActiveConsultationBanner: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [active, setActive] = useState<ActiveConsultation | null>(null);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'SEEKER') {
            setActive(null);
            return;
        }
        let cancelled = false;
        const check = () => {
            api.consultations.getHistory().then((history: ActiveConsultation[]) => {
                if (cancelled) return;
                setActive(history.find(c => BLOCKING_STATUSES.includes(c.status)) || null);
            }).catch(() => {});
        };
        check();
        const interval = setInterval(check, POLL_INTERVAL_MS);
        return () => { cancelled = true; clearInterval(interval); };
    }, [isAuthenticated, user]);

    if (!active) return null;
    if (location.pathname === `/chat/${active.id}`) return null;

    return (
        <div className="bg-gradient-to-r from-[#E91E63] to-[#FF5722] text-white shadow-lg">
            <div className="container mx-auto px-4 py-2 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="animate-pulse" size={14} />
                    </div>
                    <p className="text-xs md:text-sm font-semibold truncate">
                        You have a chat in progress. Finish or resume it before starting another.
                    </p>
                </div>
                <button
                    onClick={() => navigate(`/chat/${active.id}`)}
                    className="w-full sm:w-auto bg-white text-[#E91E63] px-4 py-1 rounded-full font-bold text-xs md:text-sm hover:bg-gray-100 active:scale-95 transition-all shadow-sm whitespace-nowrap"
                >
                    Resume Chat →
                </button>
            </div>
        </div>
    );
};

export default ActiveConsultationBanner;
