import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AstrologerList from '../components/AstrologerList';
import SEO from '../components/SEO';
import PageHeading from '../components/PageHeading';
import AeoDirectAnswer from '../components/AeoDirectAnswer';
import FAQSection from '../components/FAQSection';
import { api } from '../services/api';
import type { AstrologerCityFilter } from '../types';
import '../pages/services/ServicesDetail.css';

// Pages are about consulting online *from* a city. `matchNames` lists the spellings
// an astrologer may have entered as their profile city (matched case-insensitively,
// also as "City, State"); astrologers based there are listed first.
interface CityInfo {
    name: string;
    state: string;
    description: string;
    matchNames: string[];
}

const CITY_MAP: Record<string, CityInfo> = {
    delhi: {
        name: 'Delhi NCR',
        state: 'Delhi',
        description: 'Consult verified Vedic astrologers online from Delhi NCR for private chat consultations, Kundli matching, and Jyotish remedies.',
        matchNames: ['Delhi', 'New Delhi', 'Noida', 'Greater Noida', 'Gurgaon', 'Gurugram', 'Ghaziabad', 'Faridabad']
    },
    mumbai: {
        name: 'Mumbai',
        state: 'Maharashtra',
        description: 'Consult Vedic astrologers and tarot readers online from Mumbai for career guidance, love advice, and Kundli analysis.',
        matchNames: ['Mumbai', 'Bombay']
    },
    bangalore: {
        name: 'Bangalore',
        state: 'Karnataka',
        description: 'Consult trusted Vedic astrologers online from Bangalore for career guidance, Kundli matching, and relationship advice.',
        matchNames: ['Bangalore', 'Bengaluru']
    },
    kolkata: {
        name: 'Kolkata',
        state: 'West Bengal',
        description: 'Consult experienced Vedic astrologers and Kundli experts online from Kolkata through private chat consultations.',
        matchNames: ['Kolkata', 'Calcutta']
    },
    chennai: {
        name: 'Chennai',
        state: 'Tamil Nadu',
        description: 'Consult Vedic Jyotish experts online from Chennai for marriage Kundli matching and personal guidance.',
        matchNames: ['Chennai', 'Madras']
    },
    hyderabad: {
        name: 'Hyderabad',
        state: 'Telangana',
        description: 'Consult verified astrologers online from Hyderabad for career timing, marriage compatibility, and Vastu Shastra advice.',
        matchNames: ['Hyderabad', 'Secunderabad']
    },
    pune: {
        name: 'Pune',
        state: 'Maharashtra',
        description: 'Consult top-rated Vedic astrologers online from Pune for private consultations, birth chart analysis, and remedies.',
        matchNames: ['Pune']
    },
    ahmedabad: {
        name: 'Ahmedabad',
        state: 'Gujarat',
        description: 'Consult experienced Vedic astrologers online from Ahmedabad for business, career, and Kundli matching.',
        matchNames: ['Ahmedabad']
    },
    jaipur: {
        name: 'Jaipur',
        state: 'Rajasthan',
        description: 'Consult Vedic astrologers online from Jaipur for Kundli analysis, career decisions, and marriage matching.',
        matchNames: ['Jaipur']
    },
    lucknow: {
        name: 'Lucknow',
        state: 'Uttar Pradesh',
        description: 'Consult Jyotish experts online from Lucknow for Kundali Milan, horoscope readings, and remedies.',
        matchNames: ['Lucknow']
    },
    chandigarh: {
        name: 'Chandigarh',
        state: 'Punjab & Haryana',
        description: 'Consult astrologers and tarot readers online from Chandigarh for relationship advice, career timing, and birth chart analysis.',
        matchNames: ['Chandigarh', 'Mohali', 'Panchkula']
    },
    indore: {
        name: 'Indore',
        state: 'Madhya Pradesh',
        description: 'Consult verified Vedic astrologers online from Indore for business Kundli analysis, financial transits, and marriage compatibility.',
        matchNames: ['Indore']
    },
    patna: {
        name: 'Patna',
        state: 'Bihar',
        description: 'Consult Vedic Jyotish experts online from Patna for Janam Kundli readings, Manglik Dosha remedies, and career timing.',
        matchNames: ['Patna']
    },
    surat: {
        name: 'Surat',
        state: 'Gujarat',
        description: 'Consult trusted Vedic astrologers online from Surat for business partnerships, career growth, Kundli matching, and Vastu Shastra.',
        matchNames: ['Surat']
    },
    kochi: {
        name: 'Kochi',
        state: 'Kerala',
        description: 'Consult Vedic astrologers online from Kochi for private consultations and guidance on career, marriage, and family.',
        matchNames: ['Kochi', 'Cochin', 'Ernakulam']
    },
    varanasi: {
        name: 'Varanasi',
        state: 'Uttar Pradesh',
        description: 'Consult Vedic Jyotish experts online from Varanasi for Kundli analysis and spiritual remedies.',
        matchNames: ['Varanasi', 'Banaras', 'Kashi']
    },
    nagpur: {
        name: 'Nagpur',
        state: 'Maharashtra',
        description: 'Consult Vedic astrologers and numerologists online from Nagpur for private chat consultations and birth chart insights.',
        matchNames: ['Nagpur']
    },
    bhopal: {
        name: 'Bhopal',
        state: 'Madhya Pradesh',
        description: 'Consult experienced Vedic astrologers online from Bhopal for horoscope analysis, career forecasting, and marital compatibility.',
        matchNames: ['Bhopal']
    },
    coimbatore: {
        name: 'Coimbatore',
        state: 'Tamil Nadu',
        description: 'Consult trusted Vedic astrologers online from Coimbatore on business, marriage, and family matters.',
        matchNames: ['Coimbatore']
    },
    ludhiana: {
        name: 'Ludhiana',
        state: 'Punjab',
        description: 'Consult Vedic astrologers and tarot readers online from Ludhiana for overseas travel, marriage matching, and business growth.',
        matchNames: ['Ludhiana']
    },
    gurgaon: {
        name: 'Gurgaon',
        state: 'Haryana',
        description: 'Consult Vedic astrologers online from Gurgaon (Gurugram) for career guidance, startup timing, and relationship advice.',
        matchNames: ['Gurgaon', 'Gurugram']
    },
    noida: {
        name: 'Noida',
        state: 'Uttar Pradesh',
        description: 'Consult Vedic astrologers online from Noida on career change, marriage compatibility, and daily horoscopes.',
        matchNames: ['Noida', 'Greater Noida']
    },
    dubai: {
        name: 'Dubai',
        state: 'UAE',
        description: 'Consult Indian Vedic astrologers online from Dubai, UAE for confidential Kundli matching, career timing, and business Jyotish.',
        matchNames: ['Dubai']
    },
    london: {
        name: 'London',
        state: 'United Kingdom',
        description: 'Consult Indian Vedic astrologers online from London, UK for relationship guidance, marriage Kundli matching, and career readings.',
        matchNames: ['London']
    },
    toronto: {
        name: 'Toronto',
        state: 'Canada',
        description: 'Consult Indian Vedic astrologers online from Toronto, Canada for immigration prospects, career timing, and Kundali Milan.',
        matchNames: ['Toronto']
    },
    singapore: {
        name: 'Singapore',
        state: 'Singapore',
        description: 'Consult Vedic astrologers online from Singapore for business prosperity, marriage matching, and birth chart insights.',
        matchNames: ['Singapore']
    },
    'new-york': {
        name: 'New York',
        state: 'United States',
        description: 'Consult verified Vedic astrologers online from New York, USA for personalized chart analysis, love compatibility, and career timing.',
        matchNames: ['New York', 'New York City', 'NYC']
    },
    sydney: {
        name: 'Sydney',
        state: 'Australia',
        description: 'Consult experienced Indian Vedic astrologers online from Sydney, Australia for private Kundli readings and relationship advice.',
        matchNames: ['Sydney']
    }
};

const CityAstrologers: React.FC = () => {
    const { cityName = 'delhi' } = useParams<{ cityName: string }>();
    const normalizedKey = cityName.toLowerCase().trim();
    const knownCity = CITY_MAP[normalizedKey];
    const fallbackName = cityName.trim().replace(/-/g, ' ');
    const cityInfo: CityInfo = knownCity || {
        name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
        state: 'India',
        description: `Consult verified Vedic astrologers online from ${fallbackName} for private chat consultations, Kundli matching, and remedies.`,
        matchNames: [fallbackName]
    };

    const matchKey = cityInfo.matchNames.join('|');
    const localFilter = useMemo<AstrologerCityFilter>(() => ({ mode: 'only', names: matchKey.split('|') }), [matchKey]);
    const elsewhereFilter = useMemo<AstrologerCityFilter>(() => ({ mode: 'exclude', names: matchKey.split('|') }), [matchKey]);

    const formattedTitle = `Consult Astrologers Online in ${cityInfo.name} | Aadikarta`;
    const canonicalPath = `/astrologers/city/${normalizedKey}`;

    const faqs = [
        {
            question: `How can I consult an astrologer online in ${cityInfo.name}?`,
            answer: `Browse the astrologers on this page, check who is online, and tap Chat to start a private consultation. You pay per minute at the rate shown on each astrologer's card.`
        },
        {
            question: `Are these astrologers based in ${cityInfo.name}?`,
            answer: `Astrologers who list ${cityInfo.name} as their city on their Aadikarta profile are shown first. Consultations happen online, so you can also consult astrologers based elsewhere, listed below them.`
        },
        {
            question: `When are astrologers available?`,
            answer: `Each astrologer sets their own hours, shown on their card along with a live Online, Busy or Offline status. You can start a chat whenever an astrologer is online.`
        }
    ];

    const [trustStats, setTrustStats] = useState<{ total_reviews: number, average_rating: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        api.cms.getTrustStats()
            .then((data) => { if (!cancelled) setTrustStats(data); })
            .catch(() => { /* keep aggregateRating omitted rather than show placeholder numbers */ });
        return () => { cancelled = true; };
    }, []);

    const cityStructuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `https://aadikarta.org${canonicalPath}#page`,
                name: `Consult Astrologers Online in ${cityInfo.name} — Aadikarta Vedic Astrology`,
                url: `https://aadikarta.org${canonicalPath}`,
                description: cityInfo.description,
                publisher: { '@id': 'https://aadikarta.org/#organization' },
                // Only emit aggregateRating when there are real platform reviews behind
                // it — Google's review-snippet policy requires this to reflect actual
                // reviews, never a placeholder number.
                ...(trustStats && trustStats.total_reviews > 0 ? {
                    aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: trustStats.average_rating,
                        reviewCount: trustStats.total_reviews,
                        bestRating: '5',
                        worstRating: '1'
                    }
                } : {}),
                breadcrumb: {
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                        { '@type': 'ListItem', position: 2, name: 'Astrologers', item: 'https://aadikarta.org/astrologers' },
                        { '@type': 'ListItem', position: 3, name: cityInfo.name, item: `https://aadikarta.org${canonicalPath}` }
                    ]
                }
            },
            {
                '@type': 'FAQPage',
                mainEntity: faqs.map(faq => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: { '@type': 'Answer', text: faq.answer }
                }))
            }
        ]
    };

    return (
        <div className="city-astrologers-page service-detail-page min-h-screen">
            <SEO
                title={formattedTitle}
                description={cityInfo.description}
                keywords={`best astrologer in ${cityInfo.name}, online astrologer ${cityInfo.name}, Kundli matching ${cityInfo.name}, Vedic astrology consultation ${cityInfo.name}`}
                canonicalPath={canonicalPath}
                structuredData={cityStructuredData}
                // Arbitrary /astrologers/city/<anything> URLs still render, but only
                // the curated cities are meant to be indexed.
                noindex={!knownCity}
            />
            <Header />

            <main id="main-content" className="pt-8 pb-16">
                <div className="container mx-auto px-4">
                    <PageHeading
                        eyebrow={`Online Consultations · ${cityInfo.name}`}
                        title={<>Consult <span className="text-amber-500">Astrologers</span> Online in {cityInfo.name}</>}
                        subtitle={cityInfo.description}
                    />

                    <AeoDirectAnswer
                        question={`How to find the best online Vedic astrologer in ${cityInfo.name}?`}
                        answer={`On Aadikarta, you can view verified profiles, experience years, specializations, and user ratings for Vedic astrologers. Astrologers based in ${cityInfo.name} are listed first, and every consultation is a private online chat you can start from anywhere.`}
                        keyTakeaways={[
                            { label: "Verification", text: "Rigorous 4-step Screening Process" },
                            { label: "Rates", text: "Per minute, shown on each profile" },
                            { label: "Availability", text: "Live chat whenever an astrologer is online" },
                            { label: "Privacy", text: "100% Encrypted & Confidential" }
                        ]}
                    />

                    <div className="mt-8">
                        <AstrologerList
                            tone="dark"
                            cityFilter={localFilter}
                            showFilters={false}
                            heading={`Astrologers based in ${cityInfo.name}`}
                            subheading={`Astrologers who list ${cityInfo.name} as their city on their profile.`}
                            emptyMessage={`No astrologers based in ${cityInfo.name} are listed yet. The astrologers below consult online and can help you from wherever they are.`}
                        />
                        <AstrologerList
                            tone="dark"
                            cityFilter={elsewhereFilter}
                            heading="Also available online"
                            subheading={`Astrologers based outside ${cityInfo.name}. Consultations are online, so chatting with them works the same.`}
                        />
                    </div>

                    <div className="mt-16">
                        <FAQSection faqs={faqs} />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CityAstrologers;
