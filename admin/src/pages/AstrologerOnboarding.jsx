import React, { useState, useEffect } from 'react';
import { cms } from '../services/api';
import { ArrowRight, X, Mail, Ban } from 'lucide-react';
import { Avatar } from '../components/ui';
import Modal from '../components/Modal';

// Pipeline stages in order. REJECTED is a separate terminal column (not advanced into).
const STAGES = [
    { key: 'APPLIED', label: 'Applied', color: 'gray' },
    { key: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: 'blue' },
    { key: 'PROFILE_ACTIVATED', label: 'Profile Activated', color: 'indigo' },
    { key: 'ONBOARDING_INTIMATED', label: 'Onboarding Intimated', color: 'violet' },
    { key: 'ONBOARDING_STARTED', label: 'Onboarding Started', color: 'purple' },
    { key: 'TRAINING_SCHEDULED', label: 'Training Scheduled', color: 'fuchsia' },
    { key: 'COMPLETED', label: 'Completed', color: 'green' },
    { key: 'REJECTED', label: 'Rejected', color: 'red' },
];

const PIPELINE = STAGES.map(s => s.key).filter(k => k !== 'REJECTED');

// Per-target-stage: which email fields the modal must collect, and a one-line description
// of the email that will be sent on confirm.
const STAGE_CONFIG = {
    INTERVIEW_SCHEDULED: {
        email: 'Step 1 — Interview scheduled',
        fields: [
            { name: 'date', label: 'Date', placeholder: 'e.g. 25 June 2026' },
            { name: 'time', label: 'Time', placeholder: 'e.g. 4:00 PM IST' },
            { name: 'interviewer', label: 'Interviewer', placeholder: 'e.g. Ananya Sharma' },
            { name: 'meeting_link', label: 'Meeting Link', placeholder: 'https://meet…' },
        ],
    },
    PROFILE_ACTIVATED: {
        email: 'Step 2 — Profile activated (also marks the astrologer approved & active)',
        fields: [
            { name: 'consultation_fee_per_min', label: 'Consultation Fee / min (₹)', placeholder: '10', type: 'number' },
        ],
    },
    ONBOARDING_INTIMATED: { email: 'Step 3 — Welcome / selected after interview', fields: [] },
    ONBOARDING_STARTED: { email: 'Step 4 — Onboarding checklist', fields: [] },
    TRAINING_SCHEDULED: {
        email: 'Step 5 — Growth & training meeting',
        fields: [
            { name: 'day', label: 'Day', placeholder: 'e.g. Monday' },
            { name: 'date', label: 'Date', placeholder: 'e.g. 30 June 2026' },
            { name: 'time', label: 'Time', placeholder: 'e.g. 5:00 PM' },
            { name: 'timezone', label: 'Timezone', placeholder: 'e.g. IST' },
            { name: 'meeting_link', label: 'Meeting Link', placeholder: 'https://meet…' },
        ],
    },
    COMPLETED: { email: null, fields: [] },
};

const COLOR_CLASSES = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    violet: 'bg-violet-100 text-violet-700',
    purple: 'bg-purple-100 text-purple-700',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
};

const nextStage = (current) => {
    const idx = PIPELINE.indexOf(current);
    if (idx === -1 || idx === PIPELINE.length - 1) return null;
    return PIPELINE[idx + 1];
};

const AstrologerOnboarding = () => {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [transition, setTransition] = useState(null); // { astro, target }
    const [form, setForm] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchCards(); }, []);

    const fetchCards = async () => {
        try {
            const res = await cms.astrologers.onboarding();
            setCards(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load onboarding pipeline');
        } finally {
            setLoading(false);
        }
    };

    const openTransition = (astro, target) => {
        // Prefill from previously stored meta for this stage, if any.
        setForm(astro.onboarding_meta?.[target] || {});
        setTransition({ astro, target });
    };

    const submitTransition = async () => {
        const { astro, target } = transition;
        setSubmitting(true);
        try {
            await cms.astrologers.advance(astro.id, { target_stage: target, ...form });
            // Optimistic local update so the card moves immediately.
            setCards(prev => prev.map(c =>
                c.id === astro.id
                    ? { ...c, onboarding_stage: target, is_approved: target === 'PROFILE_ACTIVATED' ? true : c.is_approved }
                    : c
            ));
            setTransition(null);
            setForm({});
        } catch (err) {
            console.error(err);
            alert('Failed to update stage');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = (astro) => {
        const reason = prompt('Enter rejection reason (shown to applicant):');
        if (reason === null) return;
        cms.astrologers.reject(astro.id, { reason: reason || 'Your application did not meet our current requirements.' })
            .then(() => setCards(prev => prev.map(c => c.id === astro.id ? { ...c, onboarding_stage: 'REJECTED' } : c)))
            .catch(err => { console.error(err); alert('Rejection failed'); });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading onboarding pipeline…</div>;

    const targetCfg = transition ? STAGE_CONFIG[transition.target] : null;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Astrologer Onboarding</h1>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {cards.length} Astrologers
                </span>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

            <div className="flex gap-4 overflow-x-auto pb-4">
                {STAGES.map(stage => {
                    const stageCards = cards.filter(c => (c.onboarding_stage || 'APPLIED') === stage.key);
                    return (
                        <div key={stage.key} className="flex-shrink-0 w-72">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${COLOR_CLASSES[stage.color]}`}>
                                    {stage.label}
                                </span>
                                <span className="text-xs text-gray-400">{stageCards.length}</span>
                            </div>
                            <div className="space-y-3 min-h-[120px] bg-gray-50 rounded-xl p-2 border border-gray-100">
                                {stageCards.length === 0 ? (
                                    <div className="text-center text-xs text-gray-300 py-8">No astrologers</div>
                                ) : stageCards.map(astro => {
                                    const next = nextStage(stage.key);
                                    const isTerminal = stage.key === 'COMPLETED' || stage.key === 'REJECTED';
                                    return (
                                        <div key={astro.id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Avatar src={astro.profile?.profile_picture_url} className="w-9 h-9" iconSize={18} />
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm text-gray-900 truncate">{astro.profile?.full_name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{astro.email}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-3">
                                                {astro.profile?.experience_years ? `${astro.profile.experience_years} yrs experience` : 'Experience N/A'}
                                                {astro.profile?.city ? ` · ${astro.profile.city}` : ''}
                                            </div>
                                            {!isTerminal && (
                                                <div className="flex items-center gap-2">
                                                    {next && (
                                                        <button
                                                            onClick={() => openTransition(astro, next)}
                                                            className="flex-1 bg-purple-600 text-white text-xs font-semibold py-1.5 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                                                            title={`Advance to ${STAGES.find(s => s.key === next)?.label}`}
                                                        >
                                                            Advance <ArrowRight size={13} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleReject(astro)}
                                                        className="p-1.5 border border-red-200 text-red-500 rounded-md hover:bg-red-50 transition-colors"
                                                        title="Reject application"
                                                    >
                                                        <Ban size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Transition modal */}
            <Modal
                isOpen={!!transition}
                onClose={() => { setTransition(null); setForm({}); }}
                title={transition ? `Move to ${STAGES.find(s => s.key === transition.target)?.label}` : ''}
            >
                {transition && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <Avatar src={transition.astro.profile?.profile_picture_url} className="w-10 h-10" iconSize={20} />
                            <div>
                                <div className="font-medium text-gray-900">{transition.astro.profile?.full_name}</div>
                                <div className="text-xs text-gray-500">{transition.astro.email}</div>
                            </div>
                        </div>

                        {targetCfg?.email ? (
                            <div className="flex items-start gap-2 text-sm bg-purple-50 text-purple-800 rounded-lg p-3">
                                <Mail size={16} className="mt-0.5 flex-shrink-0" />
                                <span>An email will be sent on confirm: <strong>{targetCfg.email}</strong></span>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                                No email is sent for this stage.
                            </div>
                        )}

                        {targetCfg?.fields?.map(f => (
                            <div key={f.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                                <input
                                    type={f.type || 'text'}
                                    value={form[f.name] ?? ''}
                                    placeholder={f.placeholder}
                                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                                />
                            </div>
                        ))}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={submitTransition}
                                disabled={submitting}
                                className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60"
                            >
                                {submitting ? 'Saving…' : (targetCfg?.email ? 'Confirm & Send Email' : 'Confirm')}
                            </button>
                            <button
                                onClick={() => { setTransition(null); setForm({}); }}
                                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AstrologerOnboarding;
