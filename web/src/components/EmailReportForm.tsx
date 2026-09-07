import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { getErrorMessage } from '../utils/errors';

interface EmailReportFormProps {
    onSubmit: (email: string) => Promise<unknown>;
    label?: string;
}

/** Optional "email me a PDF copy" form shown alongside a free tool's on-page
 * result. Guest email is captured only here (not required to see the result
 * itself) — see CLAUDE.md decision: optional, after-result email capture. */
const EmailReportForm: React.FC<EmailReportFormProps> = ({ onSubmit, label = 'Email me this report as a PDF' }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setError(null);
        try {
            await onSubmit(email);
            setStatus('sent');
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to send email');
            setStatus('error');
        }
    };

    if (status === 'sent') {
        return (
            <div className="service-glass-panel p-5 flex items-center gap-3 text-emerald-400">
                <CheckCircle2 size={20} className="shrink-0" />
                <p className="text-sm text-gray-300">
                    Sent! Check <strong className="text-white">{email}</strong> for your PDF report — it may take a minute to arrive.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="service-glass-panel p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 text-gray-300 text-sm shrink-0">
                <Mail size={16} className="text-amber-500" />
                {label}
            </div>
            <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500/50"
            />
            <button
                type="submit"
                disabled={status === 'loading'}
                className="shrink-0 bg-amber-500 text-indigo-950 font-normal px-5 py-2 rounded-lg text-sm hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {status === 'loading' ? (<><Loader2 size={14} className="animate-spin" /> Sending...</>) : 'Email PDF'}
            </button>
            {error && <div className="text-red-400 text-xs sm:ml-2">{error}</div>}
        </form>
    );
};

export default EmailReportForm;
