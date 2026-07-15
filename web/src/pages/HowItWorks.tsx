import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { UserPlus, Search, Wallet, MessageSquare, Sparkles, HelpCircle, CheckCircle } from 'lucide-react';
import './services/ServicesDetail.css';

const steps = [
    {
        num: '01',
        title: 'Create Your Free Account',
        desc: 'Sign up in under 60 seconds. Enter your name, email, and basic birth details (date, time, place) to unlock personalised readings.',
        icon: <UserPlus size={24} />,
    },
    {
        num: '02',
        title: 'Browse Verified Astrologers',
        desc: 'Explore profiles of expert Vedic, Tarot, and numerology astrologers. Filter by speciality, language, ratings, and price per minute.',
        icon: <Search size={24} />,
    },
    {
        num: '03',
        title: 'Add Credits to Your Wallet',
        desc: 'Top up your Aadikarta wallet with any amount. Pay only for the minutes you actually consult — no hidden charges, no subscriptions.',
        icon: <Wallet size={24} />,
    },
    {
        num: '04',
        title: 'Start a Live Chat Consultation',
        desc: 'Hit "Chat Now" on any online astrologer\'s profile. Your session begins instantly. The per-minute fee is deducted in real time from your wallet.',
        icon: <MessageSquare size={24} />,
    },
    {
        num: '05',
        title: 'Receive Personalised Guidance',
        desc: 'Get actionable insights on career, love, health, or any question you have. Ask follow-ups, share concerns — the astrologer is with you.',
        icon: <Sparkles size={24} />,
    },
];

const faqs = [
    { q: 'How much does a consultation cost?', a: 'Each astrologer sets their own per-minute rate, starting from ₹10/min. You only pay for the time you use.' },
    { q: 'Is my personal information safe?', a: 'Yes. Your birth details and chat history are encrypted and never shared with third parties.' },
    { q: 'Can I try a free consultation?', a: 'New users may receive promotional free minutes. Check the current offer on our homepage.' },
    { q: 'What if the astrologer goes offline?', a: 'If a session is interrupted, any unused minutes are refunded to your wallet instantly.' },
    { q: 'Are the astrologers verified?', a: 'Every astrologer on Aadikarta passes a 4-step screening including qualification review and test readings.' },
];

const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebPage',
            '@id': 'https://aadikarta.org/how-it-works#page',
            name: 'How It Works – Aadikarta Astrology Consultation',
            description: 'Step-by-step guide to booking an astrology consultation on Aadikarta. Sign up, browse astrologers, add wallet credits, and start a live chat.',
            url: 'https://aadikarta.org/how-it-works',
            publisher: { '@id': 'https://aadikarta.org/#organization' },
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                    { '@type': 'ListItem', position: 2, name: 'How It Works', item: 'https://aadikarta.org/how-it-works' },
                ],
            },
        },
        {
            '@type': 'HowTo',
            name: 'How to Consult an Astrologer Online on Aadikarta',
            description: 'Book a live Vedic astrology, tarot, or kundli consultation in 5 simple steps. No appointments needed — pay only per minute.',
            totalTime: 'PT5M',
            step: steps.map((s, i) => ({
                '@type': 'HowToStep',
                position: i + 1,
                name: s.title,
                text: s.desc,
            })),
        },
        {
            '@type': 'FAQPage',
            mainEntity: faqs.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
            })),
        },
    ],
};

const HowItWorks: React.FC = () => {
    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="How It Works | Live Astrology Consultation"
                description="Book a live astrology consultation in 5 simple steps. Browse verified Vedic astrologers, add wallet credits & chat instantly. Pay per minute — no subscriptions."
                structuredData={structuredData}
            />
            <Header />

            <main>
                {/* Hero */}
                <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden min-h-[460px] flex flex-col items-center justify-center">
                    <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="max-w-3xl mx-auto relative z-10">
                        <span className="text-amber-500 font-normal uppercase tracking-widest text-sm mb-3 block">Step-By-Step Guide</span>
                        <h1 className="text-4xl md:text-6xl font-normal text-white mb-6">How Aadikarta Works</h1>
                        <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                            Get live astrology guidance in 5 simple steps — no appointments, no subscriptions.
                            Pay only for the minutes you use.
                        </p>
                        <Link
                            to="/astrologers"
                            className="inline-block mt-10 bg-amber-500 text-indigo-950 font-normal px-10 py-4 rounded-full shadow-xl hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all"
                        >
                            Browse Astrologers
                        </Link>
                    </div>
                </section>

                {/* Steps */}
                <section className="max-w-4xl mx-auto px-6 py-12">
                    <h2 className="text-3xl font-normal text-center text-white mb-16">Your Journey, Step by Step</h2>
                    <div className="space-y-8">
                        {steps.map((step, idx) => (
                            <div key={idx} className="custom-list-item">
                                <div className="icon-box">
                                    {step.icon}
                                </div>
                                <div>
                                    <div className="text-xs font-normal text-amber-500 tracking-widest uppercase mb-1">Step {step.num}</div>
                                    <h3 className="text-xl font-normal text-white mb-2">{step.title}</h3>
                                    <p className="text-gray-300 font-light leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
 
                {/* FAQ */}
                <section className="max-w-3xl mx-auto px-6 py-20">
                    <h2 className="text-3xl font-normal text-white mb-12 text-center flex items-center justify-center gap-3">
                        <HelpCircle size={28} className="text-amber-500" />
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        {faqs.map(({ q, a }, i) => (
                            <div key={i} className="service-glass-panel p-6">
                                <h3 className="font-normal text-white text-lg mb-2 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-amber-500 flex-shrink-0" />
                                    {q}
                                </h3>
                                <p className="text-gray-300 font-light pl-6">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="relative py-24 px-6 text-center overflow-hidden border-t border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/20 to-purple-950/20"></div>
                    <div className="relative z-10 max-w-xl mx-auto">
                        <h2 className="text-3xl font-normal mb-4 text-white">Ready to get your first reading?</h2>
                        <p className="text-gray-300 mb-8 text-lg font-light">Join thousands who found clarity through Aadikarta.</p>
                        <Link
                            to="/astrologers"
                            className="inline-block bg-amber-500 text-indigo-950 font-normal px-12 py-4 rounded-full shadow-2xl hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all"
                        >
                            Find Your Astrologer
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default HowItWorks;
