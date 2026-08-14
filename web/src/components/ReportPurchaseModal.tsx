import React, { useEffect, useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, Phone, Lock, Gift, User, Globe } from 'lucide-react';
import { loadRazorpay, patchRazorpaySafeArea } from '../utils/loadRazorpay';
import { api } from '../services/api';
import { resolveImageUrl } from '../utils/url';
import type { RazorpayResponse, RazorpayError } from '../types';

interface ReportPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialReportType?: 'FULL_KUNDLI' | 'GUN_MILAN' | 'CAREER_FINANCE';
}

const REPORT_INFO = {
    FULL_KUNDLI: {
        title: 'Full Life Kundli & Planetary Dasha Report',
        price: '₹199',
        strikePrice: '₹499',
        badge: 'Most Popular',
        features: [
            'D1, D9 & D10 High-Precision Vedic Charts',
            'Full 5-Year Chronological Vimshottari Dasha Forecast',
            'Personality, Wealth, Health & Marriage Analysis',
            'Custom Mantras & Gemstone Recommendations',
            'Includes ₹50 Voucher for Live Consultation',
        ],
    },
    GUN_MILAN: {
        title: 'Gun Milan & Marriage Compatibility Report',
        price: '₹149',
        strikePrice: '₹349',
        badge: 'High Accuracy',
        features: [
            '36 Guna Score Breakdown & Kuta Analysis',
            'Manglik & Nadi Dosha Assessment + Remedies',
            'Emotional, Physical & Wealth Compatibility',
            'Marital Harmony & Long-term Stability Guidance',
            'Includes ₹50 Voucher for Live Consultation',
        ],
    },
    CAREER_FINANCE: {
        title: 'Career & Financial Transit Report',
        price: '₹199',
        strikePrice: '₹499',
        badge: 'Strategic Growth',
        features: [
            'D10 Dasamsha Chart & 10th House Strength',
            'Upcoming Job Change & Promotion Windows',
            'Financial Wealth Yogas & Ashtakavarga Ratings',
            'Business vs Employment Suitability Analysis',
            'Includes ₹50 Voucher for Live Consultation',
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
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Lead Details, 2: Payment, 3: Processing/Completed

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

    const [leadId, setLeadId] = useState<number | null>(null);
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
            const data = await api.reports.captureLead({
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

            setLeadId(data.lead_id);
            // Move to Payment step
            setStep(2);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDirectPayment = async () => {
        if (!leadId) {
            setError('Please fill in your details first.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const loaded = await loadRazorpay();
            if (!loaded) {
                throw new Error('Failed to load payment SDK. Please try again.');
            }
            patchRazorpaySafeArea();

            const orderData = await api.reports.createDirectOrder({
                lead_id: leadId,
                report_type: reportType,
                language,
            });

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Aadikarta',
                description: currentInfo.title,
                order_id: orderData.gateway_order_id,
                handler: async function (response: RazorpayResponse) {
                    try {
                        const verifyData = await api.reports.verifyPayment({
                            order_reference: orderData.order_reference,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        setReportUrl(`/reports/${verifyData.order_reference}`);
                        setPdfUrl(verifyData.pdf_url ? resolveImageUrl(verifyData.pdf_url) : null);
                        setStep(3);
                    } catch (err: any) {
                        setError(err.message || 'Payment verification failed. Please contact support.');
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: fullName,
                    contact: phoneNumber,
                    email: email || undefined,
                },
                theme: { color: '#F59E0B' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: RazorpayError) {
                setError('Payment Failed: ' + response.error.description);
                setLoading(false);
            });
            rzp.open();
        } catch (err: any) {
            setError(err.message || 'Payment failed. Please try again.');
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
                        <div className="flex flex-col items-end shrink-0">
                            <span className="text-xs text-slate-500 line-through">{currentInfo.strikePrice}</span>
                            <span className="text-2xl font-bold text-amber-400">{currentInfo.price}</span>
                            <span className="text-[10px] text-slate-400">Direct Payment • No Wallet Req.</span>
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
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1.5">
                                    <User className="w-4 h-4" /> Enter Seeker Details (Step 1 of 2)
                                </h4>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
                                        className="bg-slate-950 border border-slate-800 text-xs rounded-md px-2 py-1 text-slate-200"
                                    >
                                        <option value="en">English Report</option>
                                        <option value="hi">हिंदी रिपोर्ट</option>
                                    </select>
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
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                    >
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Date of Birth *</label>
                                    <input
                                        type="date"
                                        required
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Time of Birth *</label>
                                    <input
                                        type="time"
                                        required
                                        value={tob}
                                        onChange={(e) => setTob(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
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
                                            <input
                                                type="date"
                                                required
                                                value={partnerDob}
                                                onChange={(e) => setPartnerDob(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1">Partner's Time of Birth *</label>
                                            <input
                                                type="time"
                                                required
                                                value={partnerTob}
                                                onChange={(e) => setPartnerTob(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-amber-500 outline-none"
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
                                {loading ? 'Saving Details...' : 'Proceed to Payment (Step 2)'} <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-amber-300/80 text-center leading-relaxed">
                                This AI-generated report is for entertainment and general guidance purposes only, and is not a
                                substitute for professional advice.
                            </p>
                        </form>
                    )}

                    {/* STEP 2: DIRECT PAYMENT CHECKOUT */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <h4 className="text-xs uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1.5">
                                <Lock className="w-4 h-4" /> Secure Direct Gateway Payment
                            </h4>
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300">
                                <div className="flex justify-between">
                                    <span>Customer:</span>
                                    <span className="font-semibold text-slate-100">{fullName} ({phoneNumber})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Selected Report:</span>
                                    <span className="font-semibold text-amber-200">{currentInfo.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Report Language:</span>
                                    <span className="font-semibold text-slate-100">{language === 'en' ? 'English' : 'Hindi'}</span>
                                </div>
                                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-amber-400">
                                    <span>Total Amount Payable:</span>
                                    <span>{currentInfo.price}</span>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-xs text-amber-200">
                                <Gift className="w-4 h-4 shrink-0 text-amber-400" />
                                <span>Includes ₹50 Live Consultation Voucher valid for 30 days on aadikarta.org!</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="py-2.5 border border-slate-700 text-slate-300 hover:text-slate-100 rounded-xl text-xs"
                                >
                                    Back to Details
                                </button>
                                <button
                                    onClick={handleDirectPayment}
                                    disabled={loading}
                                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-1.5"
                                >
                                    {loading ? 'Processing Payment...' : `Pay ${currentInfo.price} via UPI / Card`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: COMPLETED & WHATSAPP SENT */}
                    {step === 3 && (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-amber-200">
                                Payment Successful & Report Generated!
                            </h3>
                            <p className="text-xs text-slate-300 max-w-md mx-auto">
                                Your report has been generated successfully. A WhatsApp link has been dispatched to <strong>{phoneNumber}</strong>.
                            </p>

                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 max-w-md mx-auto text-xs text-amber-300">
                                🎁 <strong>Bonus Voucher:</strong> Use code <code>AADI50LIVE</code> on aadikarta.org to get ₹50 OFF your next live astrologer consultation!
                            </div>

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
