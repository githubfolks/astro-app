import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cms } from '../services/api';
import { ArrowRight, RotateCcw, X, Mail, Ban, Phone, Languages, Eye } from 'lucide-react';
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

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// label shown in the dropdown -> IANA zone used to build the Google Calendar link
const TIMEZONE_OPTIONS = [
    { label: 'IST (India Standard Time)', iana: 'Asia/Kolkata' },
    { label: 'GST (Gulf Standard Time)', iana: 'Asia/Dubai' },
    { label: 'SGT (Singapore)', iana: 'Asia/Singapore' },
    { label: 'GMT (London)', iana: 'Europe/London' },
    { label: 'EST (US Eastern)', iana: 'America/New_York' },
    { label: 'PST (US Pacific)', iana: 'America/Los_Angeles' },
    { label: 'UTC', iana: 'UTC' },
];

// Per-target-stage: which email fields the modal must collect, and a one-line description
// of the email that will be sent on confirm.
const STAGE_CONFIG = {
    INTERVIEW_SCHEDULED: {
        email: 'Step 1 — Interview scheduled',
        fields: [
            { name: 'date', label: 'Date', type: 'date' },
            { name: 'time', label: 'Time', type: 'time' },
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
            { name: 'day', label: 'Day', type: 'select', options: DAY_OPTIONS },
            { name: 'date', label: 'Date', type: 'date' },
            { name: 'time', label: 'Time', type: 'time' },
            { name: 'timezone', label: 'Timezone', type: 'select', options: TIMEZONE_OPTIONS.map(t => t.label) },
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

// Stages a card can be sent back to for reprocessing after an accident (e.g. a
// missed interview, a bad training session). REJECTED has no fixed position in
// the pipeline, so a rejected applicant can be reopened into any earlier stage.
const earlierStages = (current) => {
    if (current === 'REJECTED') return PIPELINE;
    const idx = PIPELINE.indexOf(current);
    if (idx <= 0) return [];
    return PIPELINE.slice(0, idx);
};

// Builds a Google Calendar "quick add" link pre-filled with the entered
// date/time/timezone so the admin can create a real calendar event (and attach
// Google Meet video conferencing from within Calendar) instead of opening a
// throwaway, unscheduled Meet room. Falls back to null when date/time aren't
// filled in yet, so the caller can open a blank Meet room instead.
const buildScheduleMeetingUrl = (astro, form) => {
    if (!form.date || !form.time) return null;

    const astroName = astro.profile?.full_name || 'Astrologer';
    const tz = TIMEZONE_OPTIONS.find(t => t.label === form.timezone)?.iana || 'Asia/Kolkata';

    const [year, month, day] = form.date.split('-').map(Number);
    const [hour, minute] = form.time.split(':').map(Number);
    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;

    // Default to a 1-hour session.
    const endDate = new Date(year, month - 1, day, hour, minute);
    endDate.setHours(endDate.getHours() + 1);
    const endStr = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `Aadikarta Training — ${astroName}`,
        dates: `${startStr}/${endStr}`,
        details: `Onboarding training session for ${astroName}. Click "Add Google Meet video conferencing" in this event, save it, then copy the generated Meet link back into the onboarding form.`,
        ctz: tz,
    });
    // Pre-fills the astrologer as a guest so saving the event in Calendar sends
    // them a real invite — the onboarding email then tells them to accept it.
    if (astro.email) params.set('add', astro.email);
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
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

    if (loading) return <div className="p-8 text-center text-gray-900">Loading onboarding pipeline…</div>;

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
                                    const backOptions = earlierStages(stage.key);
                                    return (
                                        <div key={astro.id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Avatar src={astro.profile?.profile_picture_url} className="w-9 h-9" iconSize={18} />
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm text-gray-900 truncate">{astro.profile?.full_name}</div>
                                                    <div className="text-xs text-gray-900 truncate">{astro.email}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-900 mb-2">
                                                {astro.profile?.experience_years ? `${astro.profile.experience_years} yrs experience` : 'Experience N/A'}
                                                {astro.profile?.city ? ` · ${astro.profile.city}` : ''}
                                            </div>
                                            {astro.phone_number && (
                                                <div className="text-xs text-gray-900 mb-1 flex items-center gap-1">
                                                    <Phone size={11} className="flex-shrink-0" /> {astro.phone_number}
                                                </div>
                                            )}
                                            {astro.profile?.languages && (
                                                <div className="text-xs text-gray-900 mb-2 flex items-center gap-1">
                                                    <Languages size={11} className="flex-shrink-0" /> {astro.profile.languages}
                                                </div>
                                            )}
                                            {astro.profile?.astrology_types?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {astro.profile.astrology_types.map(type => (
                                                        <span key={type} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{type}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/astrologers/view/${astro.id}`}
                                                    className="p-1.5 border border-gray-200 text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
                                                    title="View details"
                                                >
                                                    <Eye size={14} />
                                                </Link>
                                                {!isTerminal && next && (
                                                    <button
                                                        onClick={() => openTransition(astro, next)}
                                                        className="flex-1 bg-purple-600 text-white text-xs font-semibold py-1.5 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                                                        title={`Advance to ${STAGES.find(s => s.key === next)?.label}`}
                                                    >
                                                        Advance <ArrowRight size={13} />
                                                    </button>
                                                )}
                                                {!isTerminal && (
                                                    <button
                                                        onClick={() => handleReject(astro)}
                                                        className="p-1.5 border border-red-200 text-red-500 rounded-md hover:bg-red-50 transition-colors"
                                                        title="Reject application"
                                                    >
                                                        <Ban size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            {backOptions.length > 0 && (
                                                <div className="mt-2 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-md px-1.5">
                                                    <RotateCcw size={12} className="text-amber-500 flex-shrink-0" />
                                                    <select
                                                        value=""
                                                        onChange={e => { if (e.target.value) openTransition(astro, e.target.value); }}
                                                        className="w-full text-xs bg-transparent text-amber-700 py-1 focus:outline-none"
                                                        title="Reprocess: send this card back to an earlier stage"
                                                    >
                                                        <option value="">
                                                            {stage.key === 'REJECTED' ? 'Reopen into stage…' : 'Move back to…'}
                                                        </option>
                                                        {backOptions.map(key => (
                                                            <option key={key} value={key}>{STAGES.find(s => s.key === key)?.label}</option>
                                                        ))}
                                                    </select>
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
                                <div className="text-xs text-gray-900">{transition.astro.email}</div>
                            </div>
                        </div>

                        {targetCfg?.email ? (
                            <div className="flex items-start gap-2 text-sm bg-purple-50 text-purple-800 rounded-lg p-3">
                                <Mail size={16} className="mt-0.5 flex-shrink-0" />
                                <span>An email will be sent on confirm: <strong>{targetCfg.email}</strong></span>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                                No email is sent for this stage.
                            </div>
                        )}

                        {targetCfg?.fields?.map(f => {
                            const calendarUrl = f.name === 'meeting_link' ? buildScheduleMeetingUrl(transition.astro, form) : null;
                            return (
                                <div key={f.name}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                                    <div className="flex gap-2">
                                        {f.type === 'select' ? (
                                            <select
                                                value={form[f.name] ?? ''}
                                                onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                                            >
                                                <option value="">Select {f.label}</option>
                                                {f.options.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={f.type || 'text'}
                                                value={form[f.name] ?? ''}
                                                placeholder={f.placeholder}
                                                onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                                            />
                                        )}
                                        {f.name === 'meeting_link' && (
                                            <a
                                                href={calendarUrl || 'https://meet.google.com/new'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-shrink-0 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                                                title={calendarUrl ? 'Opens Google Calendar with this session pre-filled, astrologer added as a guest' : 'Fill in Date and Time above to schedule on the calendar — opens a blank Meet room for now'}
                                            >
                                                {calendarUrl ? 'Schedule Meeting' : 'Create'}
                                            </a>
                                        )}
                                    </div>
                                    {f.name === 'meeting_link' && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            {calendarUrl
                                                ? '"Schedule Meeting" opens Google Calendar with this session and the astrologer pre-filled as a guest — click "Add Google Meet video conferencing", save the event (this sends them a calendar invite), then copy the generated link back here.'
                                                : 'Fill in Date and Time above to schedule a calendar event. Without them, "Create" just opens a blank Google Meet room to copy a link from.'}
                                        </p>
                                    )}
                                </div>
                            );
                        })}

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
