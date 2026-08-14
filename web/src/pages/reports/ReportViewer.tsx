import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Download, MessageSquare, ShieldCheck, ChevronLeft, AlertCircle, Flame, Infinity as InfinityIcon, Orbit, Award } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '../../services/api';
import { resolveImageUrl } from '../../utils/url';
import { KundliContent } from '../../components/KundliPanel';
import SEO from '../../components/SEO';

// The LLM synthesis uses light markdown (**bold** for section headers and
// inline emphasis) that read literally as asterisks when shown as plain
// text. Render it as React elements directly — no HTML parsing/injection.
function renderSynthesisBlock(block: string, key: number) {
    const trimmed = block.trim();
    const headingMatch = /^\*\*(.+)\*\*$/s.exec(trimmed);
    if (headingMatch && !headingMatch[1].includes('\n')) {
        return (
            <h3 key={key} className="font-serif font-bold text-sm md:text-base text-amber-200 mt-5 first:mt-0">
                {headingMatch[1]}
            </h3>
        );
    }

    const parts = trimmed.split(/(\*\*.+?\*\*)/g).filter(Boolean);
    return (
        <p key={key} className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {parts.map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={i} className="text-amber-100 font-semibold">{part.slice(2, -2)}</strong>
                ) : (
                    part
                )
            )}
        </p>
    );
}

const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

interface YogaItem {
    id?: string;
    name: string;
    type?: string;
    category?: string;
    active: boolean;
    description?: string;
    strength?: string;
}

function DoshaCard({
    icon: Icon, title, present, description, extra,
}: { icon: LucideIcon; title: string; present: boolean; description?: string; extra?: React.ReactNode }) {
    return (
        <div className={`rounded-xl p-4 border ${present ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${present ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                    <Icon className={`w-4 h-4 ${present ? 'text-red-400' : 'text-emerald-400'}`} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-100">{title}</h4>
                        <span className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${present ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {present ? 'Present' : 'Clear'}
                        </span>
                    </div>
                    {description && <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{description}</p>}
                    {extra}
                </div>
            </div>
        </div>
    );
}

/** Dosha, Yoga, Sade Sati & Ashtakavarga analysis — all sourced from the same
 * FreeAstroAPI chart_data payload already fetched for the report (no extra API
 * calls), surfacing data previously fetched but never shown to the buyer. */
function DoshaYogaSection({ chartData }: { chartData: any }) {
    const yogas: YogaItem[] = chartData?.yogas?.yogas || [];
    const manglik = yogas.find((y) => y.id === 'manglik_dosha' || /manglik/i.test(y.name));
    const kalasarpa = yogas.find((y) => y.id === 'kala_sarpa_yoga' || /kala sarpa/i.test(y.name));
    const activeYogas = yogas.filter((y) => y.active && y.type !== 'dosha');
    const sadeSati = chartData?.chart?.sade_sati;
    const ashtakavargaTotal = chartData?.ashtakavarga?.total_points;
    const sarvashtakavarga: number[] | undefined = chartData?.ashtakavarga?.sarvashtakavarga;

    if (!manglik && !kalasarpa && activeYogas.length === 0 && !sadeSati && !ashtakavargaTotal) return null;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="font-serif text-base font-bold text-amber-300 flex items-center gap-2">
                <Award className="w-4 h-4" /> Dosha, Yoga &amp; Strength Analysis
            </h2>

            {(manglik || kalasarpa) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {manglik && (
                        <DoshaCard icon={Flame} title="Manglik Dosha" present={!!manglik.active} description={manglik.description} />
                    )}
                    {kalasarpa && (
                        <DoshaCard icon={InfinityIcon} title="Kala Sarpa Yoga" present={!!kalasarpa.active} description={kalasarpa.description} />
                    )}
                </div>
            )}

            {sadeSati?.active && (
                <DoshaCard
                    icon={Orbit}
                    title={`Shani Sade Sati — ${sadeSati.phase} Phase`}
                    present
                    description={sadeSati.description}
                    extra={sadeSati.window?.start && sadeSati.window?.end && (
                        <p className="text-[11px] text-amber-300 mt-1.5 font-medium">
                            Full cycle (approx.): {sadeSati.window.start} to {sadeSati.window.end}
                        </p>
                    )}
                />
            )}

            {activeYogas.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Active Yogas Detected</h3>
                    <div className="flex flex-wrap gap-2">
                        {activeYogas.map((y) => (
                            <span
                                key={y.id || y.name}
                                title={y.description}
                                className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200"
                            >
                                {y.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {sarvashtakavarga && sarvashtakavarga.length === 12 && (
                <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Ashtakavarga — {ashtakavargaTotal} Total Bindus
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {sarvashtakavarga.map((points, idx) => (
                            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center">
                                <div className="text-[9px] text-slate-500 uppercase">{ZODIAC_SIGNS[idx].slice(0, 3)}</div>
                                <div className="text-sm font-bold text-amber-300">{points}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface ReportDetails {
    order_id: number;
    order_reference: string;
    report_type: string;
    language: string;
    report_data: any;
    pdf_url: string;
    created_at: string;
}

export const ReportViewer: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [report, setReport] = useState<ReportDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const data = await api.reports.getReport(orderId!);
                setReport(data);
            } catch (err: any) {
                setError(err.message || 'Report not found or payment pending');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchReport();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
                <SEO title="Loading Your Report" description="Retrieving your Vedic astrology report." noindex />
                <div className="flex flex-col items-center gap-3">
                    <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
                    <p className="text-sm font-serif text-amber-200">Retrieving your Vedic Aadikarta Report...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100 p-4">
                <SEO title="Report Unavailable" description="This report link is invalid or the payment is still pending." noindex />
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md text-center space-y-4">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <h2 className="text-lg font-serif font-bold text-amber-200">Unable to View Report</h2>
                    <p className="text-xs text-slate-400">{error || 'Invalid report link or pending payment.'}</p>
                    <Link to="/" className="inline-block py-2 px-4 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl">
                        Return to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    const { report_data, pdf_url } = report;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
            <SEO
                title="Your Vedic Astrology Report"
                description="A private, personalized Vedic astrology report."
                noindex
            />
            {/* Header */}
            <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
                    <ChevronLeft className="w-4 h-4" /> Home
                </Link>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-serif text-sm font-bold text-amber-200">Aadikarta AI Report</span>
                </div>
                {pdf_url && (
                    <a
                        href={resolveImageUrl(pdf_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
                    >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                    </a>
                )}
            </header>

            {/* Container */}
            <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
                {/* Title Card */}
                <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center space-y-2 relative overflow-hidden">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] uppercase font-bold text-amber-300">
                        <ShieldCheck className="w-3.5 h-3.5" /> Certified Vedic Analysis
                    </div>
                    <h1 className="font-serif text-xl md:text-2xl font-bold text-amber-100">
                        {report_data?.report_title || 'Vedic Astrological Report'}
                    </h1>
                    <p className="text-xs text-slate-400">
                        Ref Code: <code>{report.order_reference}</code> • Generated for {report_data?.seeker_details?.full_name || 'Seeker'}
                    </p>
                </div>

                {/* Full Birth Chart — same chart & detail tables used in the astrologer chat panel */}
                {report.report_type === 'FULL_KUNDLI' && report_data?.chart_data?.chart && (
                    <div className="bg-white border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-700 to-indigo-800">
                            <h2 className="text-base font-serif font-bold text-white">Your Birth Chart & Planetary Details</h2>
                        </div>
                        <KundliContent chartData={report_data.chart_data} canShare={false} />
                    </div>
                )}

                {report.report_type === 'FULL_KUNDLI' && report_data?.chart_data && (
                    <DoshaYogaSection chartData={report_data.chart_data} />
                )}

                {/* Report Content Body */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-sm text-slate-200 leading-relaxed">
                    <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                        <h2 className="font-serif text-base font-bold text-amber-300">AI Synthesized Astrological Reading</h2>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Language: {report.language.toUpperCase()}</span>
                    </div>

                    <div className="space-y-3">
                        {(report_data?.ai_synthesis || 'No synthesis content available.')
                            .split(/\n\s*\n/)
                            .map((block: string, idx: number) => renderSynthesisBlock(block, idx))}
                    </div>

                    {/* Section Call to Action to Live Chat */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-amber-400" />
                            <span className="text-xs text-slate-300">Have specific questions about this reading?</span>
                        </div>
                        <Link
                            to="/astrologers"
                            className="py-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs rounded-xl hover:from-amber-400 flex items-center gap-1.5 shadow"
                        >
                            Discuss Section Live with Astrologer
                        </Link>
                    </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[11px] text-slate-500 leading-relaxed px-1">
                    <strong className="text-slate-400">Disclaimer:</strong> This report is generated by an AI system based on Vedic
                    astrological principles and is intended for entertainment and general guidance purposes only. It is not a
                    substitute for professional financial, legal, medical, or psychological advice, and Aadikarta.org makes no
                    guarantee of outcome or accuracy. For personalised guidance, please consult a qualified live astrologer through
                    the platform.
                </p>
            </main>
        </div>
    );
};

export default ReportViewer;
