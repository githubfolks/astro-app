import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import FAQSection from '../../components/FAQSection';
import PageHeading from '../../components/PageHeading';

const faqs = [
    { question: 'What is the difference between a sun sign and moon sign horoscope?', answer: 'Sun sign horoscopes are based on your birth date (Western astrology). Moon sign horoscopes (Vedic/Indian) use the lunar sign, which many Vedic astrologers consider more accurate for daily and monthly predictions.' },
    { question: 'How is a personalized horoscope different from a generic one?', answer: 'A personalized horoscope is based on your exact birth date, time, and location, giving predictions tailored to your unique planetary positions. Generic sun-sign horoscopes apply to everyone born in the same month.' },
    { question: 'Which zodiac sign has the best horoscope today?', answer: 'Daily planetary transits affect each sign differently. Rather than a "best" sign, each sign has favorable days based on its ruling planet\'s position. An astrologer can identify your power days each week.' },
    { question: 'How much does a daily horoscope consultation cost on Aadikarta Vedic Astrology?', answer: 'Daily horoscope consultations on Aadikarta Vedic Astrology start from ₹10 per minute. A quick daily or weekly reading typically takes 10–15 minutes.' },
];

const SIGNS = [
    { slug: 'aries', name: 'Aries', hindi: 'मेष', symbol: '♈', glyph: '🐏', dates: 'Mar 21 – Apr 19', element: 'Fire' },
    { slug: 'taurus', name: 'Taurus', hindi: 'वृषभ', symbol: '♉', glyph: '🐂', dates: 'Apr 20 – May 20', element: 'Earth' },
    { slug: 'gemini', name: 'Gemini', hindi: 'मिथुन', symbol: '♊', glyph: '👯', dates: 'May 21 – Jun 20', element: 'Air' },
    { slug: 'cancer', name: 'Cancer', hindi: 'कर्क', symbol: '♋', glyph: '🦀', dates: 'Jun 21 – Jul 22', element: 'Water' },
    { slug: 'leo', name: 'Leo', hindi: 'सिंह', symbol: '♌', glyph: '🦁', dates: 'Jul 23 – Aug 22', element: 'Fire' },
    { slug: 'virgo', name: 'Virgo', hindi: 'कन्या', symbol: '♍', glyph: '👧', dates: 'Aug 23 – Sep 22', element: 'Earth' },
    { slug: 'libra', name: 'Libra', hindi: 'तुला', symbol: '♎', glyph: '⚖️', dates: 'Sep 23 – Oct 22', element: 'Air' },
    { slug: 'scorpio', name: 'Scorpio', hindi: 'वृश्चिक', symbol: '♏', glyph: '🦂', dates: 'Oct 23 – Nov 21', element: 'Water' },
    { slug: 'sagittarius', name: 'Sagittarius', hindi: 'धनु', symbol: '♐', glyph: '🏹', dates: 'Nov 22 – Dec 21', element: 'Fire' },
    { slug: 'capricorn', name: 'Capricorn', hindi: 'मकर', symbol: '♑', glyph: '🕷️', dates: 'Dec 22 – Jan 19', element: 'Earth' },
    { slug: 'aquarius', name: 'Aquarius', hindi: 'कुंभ', symbol: '♒', glyph: '🏺', dates: 'Jan 20 – Feb 18', element: 'Air' },
    { slug: 'pisces', name: 'Pisces', hindi: 'मीन', symbol: '♓', glyph: '🐟', dates: 'Feb 19 – Mar 20', element: 'Water' },
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
            '@id': 'https://aadikarta.org/services/horoscope#page',
            name: 'Horoscope by Zodiac Sign | Aadikarta Vedic Astrology',
            url: 'https://aadikarta.org/services/horoscope',
            description: 'Daily and monthly horoscope readings for all 12 zodiac signs. Personalized Vedic astrology predictions from expert astrologers on Aadikarta Vedic Astrology.',
            publisher: { '@id': 'https://aadikarta.org/#organization' },
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                { '@type': 'ListItem', position: 2, name: 'Horoscope', item: 'https://aadikarta.org/services/horoscope' },
            ],
        },
        {
            '@type': 'ItemList',
            name: 'Zodiac Sign Horoscopes',
            itemListElement: SIGNS.map((s, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: `${s.name} Horoscope`,
                url: `https://aadikarta.org/services/horoscope/${s.slug}`,
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

const HoroscopeListing: React.FC = () => {
    return (
        <div className="bg-white text-slate-900 min-h-screen">
            <SEO
                title="Horoscope by Zodiac Sign | Vedic Predictions | Aadikarta Vedic Astrology"
                description="Daily & monthly horoscope for all 12 zodiac signs on Aadikarta Vedic Astrology. Personalized Vedic astrology predictions from expert astrologers."
                keywords="Aadikarta Vedic Astrology horoscope, daily rashiphal, zodiac sign horoscopes, Aries Taurus Gemini Cancer horoscope Aadikarta"
                structuredData={structuredData}
            />
            <Header />

            <main>
                <section className="spiritual-bg text-white pt-16 pb-12 px-6 text-center">
                    <div className="max-w-4xl mx-auto">
                        <PageHeading
                            eyebrow="Zodiac Signs"
                            title="Horoscope by Zodiac Sign"
                            subtitle="Select your zodiac sign for personalised Vedic astrology insights — personality, predictions, and live readings from expert astrologers."
                        />
                    </div>
                </section>

                <section className="max-w-5xl mx-auto px-6 py-16">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                        {SIGNS.map((sign) => (
                            <Link
                                key={sign.slug}
                                to={`/services/horoscope/${sign.slug}`}
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

                <section className="bg-slate-50 py-12 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Zodiac Signs by Element</h2>
                        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                            {(['Fire', 'Earth', 'Air', 'Water'] as const).map((element) => (
                                <div key={element} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                    <div className={`inline-block px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${ELEMENT_COLORS[element]} mb-3`}>
                                        {element}
                                    </div>
                                    <ul className="space-y-1">
                                        {SIGNS.filter((s) => s.element === element).map((s) => (
                                            <li key={s.slug}>
                                                <Link to={`/services/horoscope/${s.slug}`} className="text-sm text-slate-700 hover:text-indigo-600 transition-colors">
                                                    {s.symbol} {s.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="faq-wrapper-section py-8 bg-gradient-to-b from-[#0f0927] to-[#03010b]">
                    <FAQSection faqs={faqs} title="Daily Horoscope FAQs" />
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

export default HoroscopeListing;
