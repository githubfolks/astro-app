import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageHeading from '../../components/PageHeading';
import SEO from '../../components/SEO';
import FAQSection from '../../components/FAQSection';
import type { FAQItem } from '../../components/FAQSection';
import { Check } from 'lucide-react';
import '../services/ServicesDetail.css';

export interface ComparisonRow {
    label: string;
    aadikarta: string;
    competitor: string;
}

export interface ComparisonPageProps {
    competitorName: string;
    competitorSlug: string;
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    intro: string;
    rows: ComparisonRow[];
    differentiators: { title: string; desc: string }[];
    faqs: FAQItem[];
    /** ISO date the competitor figures below were last checked — keep this current. */
    dataAsOf: string;
}

const ComparisonPage: React.FC<ComparisonPageProps> = ({
    competitorName,
    competitorSlug,
    metaTitle,
    metaDescription,
    keywords,
    intro,
    rows,
    differentiators,
    faqs,
    dataAsOf,
}) => {
    useEffect(() => {
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                '@id': `https://aadikarta.org/vs/${competitorSlug}#webpage`,
                name: metaTitle,
                description: metaDescription,
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
                    { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://aadikarta.org/vs' },
                    { '@type': 'ListItem', position: 3, name: `vs ${competitorName}`, item: `https://aadikarta.org/vs/${competitorSlug}` },
                ],
            },
        ],
    };

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title={metaTitle}
                description={metaDescription}
                keywords={keywords}
                structuredData={structuredData}
            />
            <Header />

            <header className="relative pt-16 pb-12 px-6 text-center overflow-hidden">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <PageHeading
                        eyebrow="Compare"
                        title={<>Aadikarta vs <span className="text-amber-500">{competitorName}</span></>}
                        subtitle={intro}
                    />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                <section className="overflow-x-auto" data-aos="fade-up">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="py-4 px-4 text-gray-400 font-normal">&nbsp;</th>
                                <th className="py-4 px-4 text-amber-500 font-normal text-lg">Aadikarta</th>
                                <th className="py-4 px-4 text-gray-300 font-normal text-lg">{competitorName}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx} className="border-b border-white/5">
                                    <td className="py-4 px-4 text-gray-400">{row.label}</td>
                                    <td className="py-4 px-4 text-white">{row.aadikarta}</td>
                                    <td className="py-4 px-4 text-gray-300">{row.competitor}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-xs text-gray-500 mt-4">
                        Competitor details reflect publicly available information as of {dataAsOf} and may have changed since — check {competitorName}'s own site for current pricing and terms.
                    </p>
                </section>

                <section className="text-center py-6" data-aos="fade-up">
                    <h2 className="text-3xl font-normal text-white mb-12">Why People Choose Aadikarta</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        {differentiators.map((item, idx) => (
                            <div key={idx} className="custom-list-item">
                                <div className="icon-box"><Check size={20} /></div>
                                <div>
                                    <h4 className="text-xl font-normal text-white mb-2">{item.title}</h4>
                                    <p className="text-gray-300 font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/astrologers" className="inline-block mt-16 bg-amber-500 text-indigo-950 px-12 py-4 rounded-full font-normal text-lg shadow-xl shadow-amber-500/10 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all">
                        Try Aadikarta — From ₹10/min
                    </Link>
                </section>

                <FAQSection faqs={faqs} />
            </main>
            <Footer />
        </div>
    );
};

export default ComparisonPage;
