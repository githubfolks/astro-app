import React, { useEffect, useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, Phone, User, Globe } from 'lucide-react';
import SegmentSelect from './SegmentSelect';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import { api } from '../services/api';
import { resolveImageUrl } from '../utils/url';

interface ReportPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialReportType?: 'FULL_KUNDLI' | 'GUN_MILAN' | 'CAREER_FINANCE';
}

export const REPORT_INFO = {
    FULL_KUNDLI: {
        title: 'Full Life Kundli & Planetary Dasha Report',
        price: 'FREE',
        strikePrice: '₹499',
        badge: 'Most Popular',
        features: [
            'D1, D9 & D10 High-Precision Vedic Charts',
            'Full 5-Year Chronological Vimshottari Dasha Forecast',
            'Personality, Wealth, Health & Marriage Analysis',
            'Custom Mantras & Gemstone Recommendations',
        ],
    },
    GUN_MILAN: {
        title: 'Gun Milan & Marriage Compatibility Report',
        price: 'FREE',
        strikePrice: '₹349',
        badge: 'High Accuracy',
        features: [
            '36 Guna Score Breakdown & Kuta Analysis',
            'Manglik & Nadi Dosha Assessment + Remedies',
            'Emotional, Physical & Wealth Compatibility',
            'Marital Harmony & Long-term Stability Guidance',
        ],
    },
    CAREER_FINANCE: {
        title: 'Career & Financial Transit Report',
        price: 'FREE',
        strikePrice: '₹499',
        badge: 'Strategic Growth',
        features: [
            'D10 Dasamsha Chart & 10th House Strength',
            'Upcoming Job Change & Promotion Windows',
            'Financial Wealth Yogas & Ashtakavarga Ratings',
            'Business vs Employment Suitability Analysis',
        ],
    },
};

export const ReportPurchaseModal: React.FC<ReportPurchaseModalProps> = ({
    isOpen,
    onClose,
    initialReportType = 'FULL_KUNDLI',
}) => {
    const [reportType, setReportType] = useState<'FULL_KUNDLI' | 'GUN_MILAN' | 'CAREER_FINANCE'>(initialReportType);
    const [language, setLanguage] = useState<'en' | 'hi'>('en');
    const [step, setStep] = useState<1 | 3>(1); // 1: Lead Details, 3: Completed (free reports skip the old payment step 2)

    // Lead Form Fields
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [tob, setTob] = useState('12:00');
    const [pob, setPob] = useState('');
    const [gender, setGender] = useState('MALE');

    // Gun Milan partner fields
    const [partnerFullName, setPartnerFullName] = useState('');
    const [partnerDob, setPartnerDob] = useState('');
    const [partnerTob, setPartnerTob] = useState('12:00');
    const [partnerPob, setPartnerPob] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportUrl, setReportUrl] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    // `reportType`'s initial value only reads `initialReportType` on first mount, so without this
    // effect every subsequent open kept showing whichever report was selected the very first time
    // (e.g. clicking "Get This Report" on the Gun Milan card would open the modal on Full Kundli).
    useEffect(() => {
        if (!isOpen) return;
        setReportType(initialReportType);
    }, [isOpen, initialReportType]);

    if (!isOpen) return null;

    const currentInfo = REPORT_INFO[reportType];

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!fullName || !phoneNumber || !dob || !pob) {
            setError('Please fill in all required birth details and phone number.');
            return;
        }
        if (reportType === 'GUN_MILAN' && (!partnerFullName || !partnerDob || !partnerPob)) {
            setError("Please fill in your partner's birth details for the Gun Milan match.");
            return;
        }

        setLoading(true);
        try {
            const leadData = await api.reports.captureLead({
                full_name: fullName,
                phone_number: phoneNumber,
                email: email || undefined,
                date_of_birth: dob,
                time_of_birth: tob,
                place_of_birth: pob,
                gender,
                campaign_source: 'aadikarta.org',
                report_type: reportType,
                ...(reportType === 'GUN_MILAN' ? {
                    partner_full_name: partnerFullName,
                    partner_date_of_birth: partnerDob,
                    partner_time_of_birth: partnerTob,
                    partner_place_of_birth: partnerPob,
                } : {}),
            });

            // Reports are free — no payment step. The order is generated and
            // delivered (WhatsApp) in this same call.
            const orderData = await api.reports.createDirectOrder({
                lead_id: leadData.lead_id,
                report_type: reportType,
                language,
            });

            setReportUrl(`/reports/${orderData.order_reference}`);
            setPdfUrl(orderData.pdf_url ? resolveImageUrl(orderData.pdf_url) : null);
            setStep(3);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-5 bg-slate-950/80 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-semibold text-amber-200">
                            Aadikarta Instant AI Vedic Reports
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Report Selector Tabs */}
                    {step === 1 && (
                        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800">
                            {(['FULL_KUNDLI', 'GUN_MILAN', 'CAREER_FINANCE'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setReportType(type)}
                                    className={`py-2 px-3 text-xs md:text-sm rounded-lg transition-all ${
                                        reportType === type
                                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow'
                                            : 'font-medium text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {type === 'FULL_KUNDLI' ? 'Full Kundli' : type === 'GUN_MILAN' ? 'Gun Milan' : 'Career & Finance'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Report Product Card */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-block px-2.5 py-0.5 mb-2 text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full">
                                {currentInfo.badge}
                            </div>
                            <h3 className="text-base md:text-lg font-semibold text-amber-100">{currentInfo.title}</h3>
                            <ul className="mt-2 space-y-1 text-xs text-slate-300">
                                {currentInfo.features.map((feat, idx) => (
                                    <li key={idx} className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex flex-col items-center text-center w-full md:w-auto">
                            <span className="text-xs text-slate-500 line-through">{currentInfo.strikePrice}</span>
                            <span className="text-2xl font-bold text-amber-400">{currentInfo.price}</span>
                            <span className="text-[10px] text-slate-400">No Payment • Instant Delivery</span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-200 text-xs">
                            {error}
                        </div>
                    )}

                    {/* STEP 1: LEAD CAPTURE FORM */}
                    {step === 1 && (
                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <h4 className="text-xs uppercase font-bold tracking-wider text-amber-300 flex items-start gap-1.5">
                                    <User className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>Enter Your Details</span>
                                </h4>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <SegmentSelect
                                        value={language}
                                        onChange={setLanguage}
                                        options={[
                                            { value: 'en', label: 'English Report' },
                                            { value: 'hi', label: 'हिंदी रिपोर्ट' },
                                        ]}
                                        placeholder="Language"
                                        className="w-28 bg-slate-950 border border-slate-800 text-xs rounded-md px-2 py-1.5 text-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-slate-400 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Vikram Sharma"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Gender</label>
                                    <SegmentSelect
                                        value={gender}
                                        onChange={setGender}
                                        options={[
                                            { value: 'MALE', label: 'Male' },
                                            { value: 'FEMALE', label: 'Female' },
                                            { value: 'OTHER', label: 'Other' },
                                        ]}
                                        placeholder="Select Gender"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Date of Birth *</label>
                                    <DatePicker
                                        required
                                        value={dob}
                                        onChange={setDob}
                                        max={new Date().toISOString().slice(0, 10)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Time of Birth *</label>
                                    <TimePicker
                                        required
                                        value={tob}
                                        onChange={setTob}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-slate-400 mb-1">Place of Birth (City/State) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. New Delhi, India"
                                        value={pob}
                                        onChange={(e) => setPob(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Mobile / WhatsApp Number *</label>
                                    <div className="relative">
                                        <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                                        <input
                                            type="tel"
                                            required
                                            placeholder="+91 9876543210"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-500">PDF report link will be sent to WhatsApp</span>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Email (Optional)</label>
                                    <input
                                        type="email"
                                        placeholder="vikram@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>

                            {reportType === 'GUN_MILAN' && (
                                <div className="pt-2 space-y-3">
                                    <h4 className="text-xs uppercase font-bold tracking-wider text-amber-300">Partner's Birth Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <label className="block text-slate-400 mb-1">Partner's Full Name *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Priya Sharma"
                                                value={partnerFullName}
                                                onChange={(e) => setPartnerFullName(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1">Partner's Date of Birth *</label>
                                            <DatePicker
                                                required
                                                value={partnerDob}
                                                onChange={setPartnerDob}
                                                max={new Date().toISOString().slice(0, 10)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1">Partner's Time of Birth *</label>
                                            <TimePicker
                                                required
                                                value={partnerTob}
                                                onChange={setPartnerTob}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1">Partner's Place of Birth *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Mumbai, India"
                                                value={partnerPob}
                                                onChange={(e) => setPartnerPob(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Generating Your Report...' : 'Generate My Free Report'} <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-amber-300/80 text-center leading-relaxed">
                                This AI-generated report is for entertainment and general guidance purposes only, and is not a
                                substitute for professional advice.
                            </p>
                        </form>
                    )}

                    {/* STEP 3: COMPLETED & WHATSAPP SENT */}
                    {step === 3 && (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-amber-200">
                                Your Free Report is Ready!
                            </h3>
                            <p className="text-xs text-slate-300 max-w-md mx-auto">
                                Your report has been generated successfully. A WhatsApp link has been dispatched to <strong>{phoneNumber}</strong>.
                            </p>

                            <div className="flex flex-wrap justify-center gap-3 pt-2">
                                {reportUrl && (
                                    <a
                                        href={reportUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow"
                                    >
                                        View My Report
                                    </a>
                                )}
                                {pdfUrl && (
                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-2.5 px-5 border border-amber-500/40 text-amber-200 hover:bg-amber-500/10 font-bold rounded-xl text-xs flex items-center gap-2"
                                    >
                                        Download PDF
                                    </a>
                                )}
                                <button
                                    onClick={onClose}
                                    className="py-2.5 px-4 bg-slate-800 text-slate-200 rounded-xl text-xs hover:bg-slate-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

export default ReportPurchaseModal;
