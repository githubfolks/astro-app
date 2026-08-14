import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageHeading from '../../components/PageHeading';
import SEO from '../../components/SEO';
import FAQSection from '../../components/FAQSection';
import ReportPurchaseModal from '../../components/ReportPurchaseModal';
import { FileHeart, HeartHandshake, Briefcase, CheckCircle2, Clock, Globe, MessageSquare } from 'lucide-react';
import './ServicesDetail.css';

type ReportType = 'FULL_KUNDLI' | 'GUN_MILAN' | 'CAREER_FINANCE';

const REPORTS: Array<{ type: ReportType; icon: React.ReactNode; title: string; price: string; strikePrice: string; blurb: string }> = [
    {
        type: 'FULL_KUNDLI',
        icon: <FileHeart size={18} />,
        title: 'Full Life Kundli & Planetary Dasha Report',
        price: '₹199',
        strikePrice: '₹499',
        blurb: 'D1, D9 & D10 charts, a 5-year Vimshottari Dasha forecast, and personality, wealth, health & marriage analysis.',
    },
    {
        type: 'GUN_MILAN',
        icon: <HeartHandshake size={18} />,
        title: 'Gun Milan & Marriage Compatibility Report',
        price: '₹149',
        strikePrice: '₹349',
        blurb: '36 Guna score breakdown, Manglik & Nadi Dosha assessment, and emotional, physical & wealth compatibility.',
    },
    {
        type: 'CAREER_FINANCE',
        icon: <Briefcase size={18} />,
        title: 'Career & Financial Transit Report',
        price: '₹199',
        strikePrice: '₹499',
        blurb: 'D10 Dasamsha chart strength, upcoming job-change windows, and business vs employment suitability.',
    },
];

const faqs = [
    { question: 'How fast do I get my report?', answer: 'Your AI-synthesized Vedic report is generated within moments of a successful payment — no waiting for an astrologer to become available. You get an instant web report plus a downloadable PDF, and a WhatsApp link is sent to your mobile number.' },
    { question: 'Do I need to create an account?', answer: 'No. Enter your birth details, pay, and get your report — no login or wallet balance required.' },
    { question: "What's the difference between an instant report and a live consultation?", answer: 'An instant report is a one-time AI-generated PDF based on your exact birth chart — ideal for a quick, detailed reading. A live consultation lets you ask follow-up questions to a real astrologer in real time. Every report includes a ₹50 voucher toward your first live consultation.' },
    { question: 'Which languages are reports available in?', answer: 'English and Hindi.' },
];

const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/ai-instant-reports#service',
            name: 'AI Instant Vedic Astrology Reports on Aadikarta',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Instant AI-generated Vedic astrology reports — Full Kundli & Dasha, Gun Milan compatibility, and Career & Finance transit reports — delivered as a web report and downloadable PDF within moments of payment.',
            areaServed: 'IN',
            offers: REPORTS.map((r) => ({
                '@type': 'Offer', name: r.title, priceCurrency: 'INR', price: r.price.replace('₹', ''),
            })),
        },
        {
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                { '@type': 'ListItem', position: 2, name: 'AI Instant Reports', item: 'https://aadikarta.org/services/ai-instant-reports' },
            ],
        },
    ],
};

const InstantReports: React.FC = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportType>('FULL_KUNDLI');

    useEffect(() => {
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    const openModalFor = (type: ReportType) => {
        setSelectedReport(type);
        setModalOpen(true);
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="AI Instant Vedic Astrology Reports | Kundli, Gun Milan & Career | Aadikarta"
                description="Get an instant AI-generated Vedic astrology report — Full Kundli & Dasha, Gun Milan compatibility, or Career & Finance. No login needed, delivered in moments. From ₹149."
                keywords="Aadikarta AI report, instant kundli report, gun milan report online, career astrology report, AI vedic astrology PDF"
                structuredData={structuredData}
            />
            <Header />

            <header className="relative pt-8 pb-6 md:pt-16 md:pb-12 px-6 text-center overflow-hidden">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <PageHeading
                        eyebrow="AI Instant Reports"
                        title="Your Vedic Report, Ready in Moments"
                        subtitle="No login. No wallet top-up. Enter your birth details, pay once, and get an AI-synthesized report as a web page and downloadable PDF — plus a ₹50 voucher toward your next live consultation."
                    />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-gray-400 text-sm">
                    <span className="flex items-center gap-2"><Clock size={16} className="text-amber-500" /> Instant delivery</span>
                    <span className="flex items-center gap-2"><Globe size={16} className="text-amber-500" /> English & Hindi</span>
                    <span className="flex items-center gap-2"><MessageSquare size={16} className="text-amber-500" /> WhatsApp delivery</span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 md:py-12 space-y-12 md:space-y-24">
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6" data-aos="fade-up">
                    {REPORTS.map((report) => (
                        <div key={report.type} className="service-glass-panel p-6 md:p-8 flex flex-col">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-indigo-950 flex items-center justify-center shadow-lg">
                                    {report.icon}
                                </div>
                                <h3 className="text-lg md:text-xl font-normal text-white">{report.title}</h3>
                            </div>
                            <p className="text-sm text-gray-300 font-light leading-relaxed mb-6 flex-1">{report.blurb}</p>
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-normal text-amber-500">{report.price}</span>
                                    <span className="text-sm text-gray-500 line-through">{report.strikePrice}</span>
                                </div>
                                <button
                                    onClick={() => openModalFor(report.type)}
                                    className="bg-amber-500 hover:bg-amber-400 text-indigo-950 px-5 py-2.5 rounded-full font-normal text-sm shadow-xl shadow-amber-500/10 hover:scale-105 active:scale-95 transition-all shrink-0"
                                >
                                    Get This Report
                                </button>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="text-center py-5 md:py-10" data-aos="fade-up">
                    <h2 className="text-xl md:text-3xl font-normal text-white mb-3 md:mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-4 md:gap-6 text-left mt-8">
                        {[
                            { title: '1. Enter Birth Details', desc: 'Full name, date, time & place of birth (and your partner\'s, for Gun Milan) — no account needed.' },
                            { title: '2. Pay Securely', desc: 'One-time payment via UPI or card through Razorpay. No wallet balance required.' },
                            { title: '3. Get Your Report', desc: 'Your AI-synthesized report is ready instantly as a web page and PDF, with a link sent to WhatsApp.' },
                        ].map((step, idx) => (
                            <div key={idx} className="custom-list-item">
                                <div className="icon-box"><CheckCircle2 size={24} /></div>
                                <div>
                                    <h4 className="text-base md:text-xl font-normal text-white mb-1 md:mb-2">{step.title}</h4>
                                    <p className="text-sm md:text-base text-gray-300 font-light">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <FAQSection faqs={faqs} />
            </main>
            <Footer />

            <ReportPurchaseModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                initialReportType={selectedReport}
            />
        </div>
    );
};

export default InstantReports;
