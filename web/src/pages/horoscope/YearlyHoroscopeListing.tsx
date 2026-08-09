import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import FAQSection from '../../components/FAQSection';
import PageHeading from '../../components/PageHeading';
import { ZODIAC_SIGN_LIST } from '../../data/zodiacSigns';

const year = new Date().getFullYear();

const faqs = [
    { question: `How accurate is a yearly horoscope for ${year}?`, answer: 'A yearly horoscope based on your sun sign gives a general planetary outlook for the year — major transits, themes, and turning points. For a fully personalized forecast tied to your exact birth chart, a Vedic astrologer reading is far more precise.' },
    { question: 'What does a yearly horoscope cover?', answer: 'Our yearly horoscope covers the overall theme for the year along with dedicated love, career, and health outlooks for each zodiac sign.' },
    { question: 'How is a yearly horoscope different from a daily horoscope?', answer: 'A daily horoscope reflects short-term planetary transits affecting your sign today, while a yearly horoscope looks at the broader planetary movements — like Jupiter and Saturn transits — shaping the entire year ahead.' },
    { question: 'Can I get a personalized yearly prediction?', answer: 'Yes — connect with one of our expert Vedic astrologers for a yearly forecast based on your exact birth date, time, and place rather than just your sun sign.' },
];

const ELEMENT_COLORS: Record<string, string> = {
    Fire: 'from-orange-400 to-red-500',
    Earth: 'from-green-400 to-emerald-600',
    Air: 'from-sky-400 to-blue-500',
    Water: 'from-indigo-400 to-purple-600',
};

const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'CollectionPage',
            '@id': 'https://aadikarta.org/services/horoscope/yearly#page',
            name: `Yearly Horoscope ${year} by Zodiac Sign | Aadikarta Vedic Astrology`,
            url: 'https://aadikarta.org/services/horoscope/yearly',
            description: `Yearly horoscope predictions for ${year} for all 12 zodiac signs. Personalized Vedic astrology forecasts from expert astrologers on Aadikarta Vedic Astrology.`,
            publisher: { '@id': 'https://aadikarta.org/#organization' },
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                { '@type': 'ListItem', position: 2, name: 'Horoscope', item: 'https://aadikarta.org/services/horoscope' },
                { '@type': 'ListItem', position: 3, name: 'Yearly Horoscope', item: 'https://aadikarta.org/services/horoscope/yearly' },
            ],
        },
        {
            '@type': 'ItemList',
            name: `Zodiac Sign Yearly Horoscopes ${year}`,
            itemListElement: ZODIAC_SIGN_LIST.map((s, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: `${s.name} Yearly Horoscope`,
                url: `https://aadikarta.org/services/horoscope/yearly/${s.slug}`,
            })),
        },
        {
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer }
            }))
        },
    ],
};

const YearlyHoroscopeListing: React.FC = () => {
    return (
        <div className="bg-white text-slate-900 min-h-screen">
            <SEO
                title={`Yearly Horoscope ${year} by Zodiac Sign | Aadikarta Vedic Astrology`}
                description={`Yearly horoscope predictions for ${year} for all 12 zodiac signs on Aadikarta Vedic Astrology. Personalized Vedic astrology forecasts from expert astrologers.`}
                keywords={`Aadikarta Vedic Astrology yearly horoscope, ${year} rashiphal, zodiac sign yearly predictions, Aries Taurus Gemini Cancer yearly horoscope Aadikarta`}
                structuredData={structuredData}
            />
            <Header />

            <main>
                <section className="spiritual-bg text-white pt-16 pb-12 px-6 text-center">
                    <div className="max-w-4xl mx-auto">
                        <PageHeading
                            eyebrow="Zodiac Signs"
                            title={`Yearly Horoscope ${year}`}
                            subtitle={`Select your zodiac sign for a full ${year} Vedic astrology forecast — love, career, health, and the major planetary themes shaping your year.`}
                        />
                        <Link
                            to="/services/horoscope"
                            className="inline-block mt-6 text-sm font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4"
                        >
                            ← Looking for today's horoscope?
                        </Link>
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-6 py-16">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                        {ZODIAC_SIGN_LIST.map((sign) => (
                            <Link
                                key={sign.slug}
                                to={`/services/horoscope/yearly/${sign.slug}`}
                                className="group flex flex-col items-center p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center"
                            >
                                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${ELEMENT_COLORS[sign.element]} flex items-center justify-center text-3xl mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`} role="img" aria-label={`${sign.name} icon`}>
                                    {sign.glyph}
                                </div>
                                <h2 className="font-bold text-slate-800 text-base">{sign.name}</h2>
                                <span className="text-xs text-slate-400 mt-0.5">{sign.hindi}</span>
                                <span className="text-xs text-indigo-500 mt-1">{sign.dates}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="faq-wrapper-section py-8 bg-gradient-to-b from-[#0f0927] to-[#03010b]">
                    <FAQSection faqs={faqs} title={`Yearly Horoscope ${year} FAQs`} />
                </section>

                <section className="bg-indigo-700 text-white py-16 px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Want a personalised reading?</h2>
                    <p className="text-indigo-200 mb-8 max-w-xl mx-auto">
                        Go beyond your sun sign — connect with a Vedic astrologer for a full birth chart reading tailored to your exact birth time and place.
                    </p>
                    <Link
                        to="/astrologers"
                        className="inline-block bg-amber-500 text-indigo-950 px-12 py-4 rounded-full font-normal text-lg shadow-xl shadow-amber-500/10 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all"
                    >
                        Chat with an Astrologer
                    </Link>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default YearlyHoroscopeListing;
