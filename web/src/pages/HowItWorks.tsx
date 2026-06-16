import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const steps = [
    {
        num: '01',
        title: 'Create Your Free Account',
        desc: 'Sign up in under 60 seconds. Enter your name, email, and basic birth details (date, time, place) to unlock personalised readings.',
        icon: '👤',
    },
    {
        num: '02',
        title: 'Browse Verified Astrologers',
        desc: 'Explore profiles of expert Vedic, Tarot, and numerology astrologers. Filter by speciality, language, ratings, and price per minute.',
        icon: '🔍',
    },
    {
        num: '03',
        title: 'Add Credits to Your Wallet',
        desc: 'Top up your Aadikarta wallet with any amount. Pay only for the minutes you actually consult — no hidden charges, no subscriptions.',
        icon: '💳',
    },
    {
        num: '04',
        title: 'Start a Live Chat Consultation',
        desc: 'Hit "Chat Now" on any online astrologer\'s profile. Your session begins instantly. The per-minute fee is deducted in real time from your wallet.',
        icon: '💬',
    },
    {
        num: '05',
        title: 'Receive Personalised Guidance',
        desc: 'Get actionable insights on career, love, health, or any question you have. Ask follow-ups, share concerns — the astrologer is with you.',
        icon: '✨',
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
        <div className="bg-white text-slate-900 min-h-screen">
            <SEO
                title="How It Works | Live Astrology Consultation"
                description="Book a live astrology consultation in 5 simple steps. Browse verified Vedic astrologers, add wallet credits & chat instantly. Pay per minute — no subscriptions."
                structuredData={structuredData}
            />
            <Header />

            <main>
                {/* Hero */}
                <section className="spiritual-bg text-white py-20 px-6 text-center">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">How Aadikarta Works</h1>
                        <p className="text-xl text-indigo-100 font-light max-w-2xl mx-auto">
                            Get live astrology guidance in 5 simple steps — no appointments, no subscriptions.
                            Pay only for the minutes you use.
                        </p>
                        <Link
                            to="/astrologers"
                            className="inline-block mt-10 bg-white text-indigo-700 font-bold px-10 py-4 rounded-full shadow-xl hover:scale-105 transition-transform"
                        >
                            Browse Astrologers
                        </Link>
                    </div>
                </section>

                {/* Steps */}
                <section className="max-w-4xl mx-auto px-6 py-20">
                    <h2 className="text-3xl font-bold text-center text-slate-800 mb-16">Your Journey, Step by Step</h2>
                    <div className="space-y-12">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex gap-8 items-start group">
                                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg group-hover:scale-110 transition-transform">
                                    {step.icon}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-1">Step {step.num}</div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">{step.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Trust signals */}
                <section className="bg-indigo-50 py-16 px-6">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
                        {[
                            { stat: '500+', label: 'Verified Astrologers' },
                            { stat: '1 Lakh+', label: 'Consultations Completed' },
                            { stat: '4.8★', label: 'Average Rating' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm">
                                <div className="text-4xl font-black text-indigo-600 mb-2">{item.stat}</div>
                                <div className="text-slate-600 font-medium">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="max-w-3xl mx-auto px-6 py-20">
                    <h2 className="text-3xl font-bold text-slate-800 mb-10 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {faqs.map(({ q, a }, i) => (
                            <div key={i} className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-2">{q}</h3>
                                <p className="text-slate-600">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-indigo-700 text-white py-16 px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to get your first reading?</h2>
                    <p className="text-indigo-200 mb-8 text-lg">Join thousands who found clarity through Aadikarta.</p>
                    <Link
                        to="/astrologers"
                        className="inline-block bg-white text-indigo-700 font-bold px-12 py-4 rounded-full shadow-xl hover:scale-105 transition-transform"
                    >
                        Find Your Astrologer
                    </Link>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default HowItWorks;
