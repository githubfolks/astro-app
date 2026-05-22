import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const tiers = [
    {
        label: 'Budget-Friendly',
        range: '₹10 – ₹30 / min',
        desc: 'Great for a quick question or your first consultation.',
        highlight: false,
    },
    {
        label: 'Expert Astrologers',
        range: '₹31 – ₹60 / min',
        desc: 'Experienced professionals with 500+ consultations and high ratings.',
        highlight: true,
    },
    {
        label: 'Master Consultants',
        range: '₹61 – ₹150 / min',
        desc: 'Senior Jyotish experts with 10+ years of practice and deep specialisations.',
        highlight: false,
    },
];

const faqs = [
    {
        q: 'How does per-minute billing work?',
        a: 'When you start a chat, the astrologer\'s per-minute fee is deducted from your wallet every 60 seconds. You can end the chat anytime.',
    },
    {
        q: 'What is the minimum top-up amount?',
        a: 'You can add as little as ₹100 to your wallet. There is no maximum limit.',
    },
    {
        q: 'Can I get a refund if I am not satisfied?',
        a: 'Unused wallet credits can be refunded as per our Refund Policy. Session charges are non-refundable once the consultation is complete.',
    },
    {
        q: 'Are there any hidden charges or subscription fees?',
        a: 'No. Aadikarta charges zero platform fee, zero subscription fee. You only pay the astrologer\'s stated per-minute rate.',
    },
    {
        q: 'What payment methods are accepted?',
        a: 'UPI, debit/credit cards, net banking, and popular wallets are all supported via our secure payment gateway.',
    },
];

const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebPage',
            '@id': 'https://aadikarta.org/pricing#page',
            name: 'Astrology Consultation Pricing – Aadikarta',
            description: 'Transparent per-minute astrology consultation pricing on Aadikarta. No subscriptions, no hidden fees. Pay only for the time you use.',
            url: 'https://aadikarta.org/pricing',
            publisher: { '@id': 'https://aadikarta.org/#organization' },
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                    { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://aadikarta.org/pricing' },
                ],
            },
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

const Pricing: React.FC = () => {
    return (
        <div className="bg-white text-slate-900 min-h-screen">
            <SEO
                title="Astrology Consultation Pricing | Aadikarta"
                description="Transparent astrology consultation pricing starting from ₹10/min. No subscriptions, no hidden fees. Pay only for minutes you use on Aadikarta."
                structuredData={structuredData}
            />
            <Header />

            <main>
                {/* Hero */}
                <section className="spiritual-bg text-white py-20 px-6 text-center">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
                        <p className="text-xl text-indigo-100 font-light">
                            No subscriptions. No hidden fees. Pay only for the minutes you consult.
                            Rates start from as low as <strong className="text-white">₹10 per minute</strong>.
                        </p>
                    </div>
                </section>

                {/* Pricing tiers */}
                <section className="max-w-5xl mx-auto px-6 py-20">
                    <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Choose Your Astrologer</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {tiers.map((tier, i) => (
                            <div
                                key={i}
                                className={`rounded-3xl p-8 border text-center transition-all hover:-translate-y-1 hover:shadow-xl ${tier.highlight
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                    : 'bg-white border-slate-100 shadow-sm'
                                    }`}
                            >
                                <div className={`text-sm font-bold uppercase tracking-widest mb-3 ${tier.highlight ? 'text-indigo-200' : 'text-indigo-400'}`}>
                                    {tier.label}
                                </div>
                                <div className={`text-3xl font-black mb-4 ${tier.highlight ? 'text-white' : 'text-slate-800'}`}>
                                    {tier.range}
                                </div>
                                <p className={`text-sm leading-relaxed ${tier.highlight ? 'text-indigo-100' : 'text-slate-600'}`}>
                                    {tier.desc}
                                </p>
                                <Link
                                    to="/astrologers"
                                    className={`inline-block mt-8 px-8 py-3 rounded-full font-bold transition-all hover:scale-105 ${tier.highlight
                                        ? 'bg-white text-indigo-600'
                                        : 'bg-indigo-600 text-white'
                                        }`}
                                >
                                    Browse
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How billing works */}
                <section className="bg-slate-50 py-16 px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-slate-800 mb-10 text-center">How Billing Works</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            {[
                                { icon: '💳', title: 'Add Credits to Wallet', body: 'Top up your Aadikarta wallet with any amount. Credits never expire.' },
                                { icon: '⏱️', title: 'Per-Minute Deduction', body: 'When your chat starts, the astrologer\'s rate is deducted every 60 seconds automatically.' },
                                { icon: '🛑', title: 'End Anytime', body: 'Stop the consultation at any point. Remaining credits stay in your wallet for future sessions.' },
                                { icon: '🔒', title: 'Secure Payments', body: 'All transactions are processed via PCI-DSS compliant payment gateways. Your card data is never stored.' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex gap-4 items-start">
                                    <span className="text-3xl flex-shrink-0">{item.icon}</span>
                                    <div>
                                        <h3 className="font-bold text-slate-800 mb-1">{item.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">{item.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="max-w-3xl mx-auto px-6 py-20">
                    <h2 className="text-3xl font-bold text-slate-800 mb-10 text-center">Pricing FAQs</h2>
                    <div className="space-y-5">
                        {faqs.map(({ q, a }, i) => (
                            <div key={i} className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-2">{q}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-indigo-700 text-white py-16 px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Start with just ₹100</h2>
                    <p className="text-indigo-200 mb-8 text-lg">Add ₹100 to your wallet and get your first consultation today.</p>
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

export default Pricing;
