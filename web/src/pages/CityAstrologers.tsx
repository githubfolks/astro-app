import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AstrologerList from '../components/AstrologerList';
import SEO from '../components/SEO';
import PageHeading from '../components/PageHeading';
import AeoDirectAnswer from '../components/AeoDirectAnswer';
import FAQSection from '../components/FAQSection';
import { api } from '../services/api';
import '../pages/services/ServicesDetail.css';

const CITY_MAP: Record<string, { name: string; state: string; description: string }> = {
    delhi: {
        name: 'Delhi NCR',
        state: 'Delhi',
        description: 'Connect with top verified Vedic astrologers in Delhi NCR for instant online chat consultations, Kundli matching, and Jyotish remedies.'
    },
    mumbai: {
        name: 'Mumbai',
        state: 'Maharashtra',
        description: 'Consult expert Vedic astrologers and tarot readers in Mumbai for career guidance, love advice, and Kundli analysis starting from ₹10/min.'
    },
    bangalore: {
        name: 'Bangalore',
        state: 'Karnataka',
        description: 'Find trusted online Vedic astrologers in Bangalore for IT career guidance, Kundli matching, and personal relationship advice.'
    },
    kolkata: {
        name: 'Kolkata',
        state: 'West Bengal',
        description: 'Experienced Vedic astrologers and Kundli experts in Kolkata available 24/7 for online chat and call consultations.'
    },
    chennai: {
        name: 'Chennai',
        state: 'Tamil Nadu',
        description: 'Top Vedic Jyotish experts and marriage Kundli matching astrologers in Chennai for instant online guidance.'
    },
    hyderabad: {
        name: 'Hyderabad',
        state: 'Telangana',
        description: 'Consult verified online astrologers in Hyderabad for career timing, marriage compatibility, and Vastu Shastra advice.'
    },
    pune: {
        name: 'Pune',
        state: 'Maharashtra',
        description: 'Top-rated online Vedic astrologers in Pune offering private consultations, birth chart analysis, and remedies.'
    },
    ahmedabad: {
        name: 'Ahmedabad',
        state: 'Gujarat',
        description: 'Experienced Gujarati and English speaking Vedic astrologers in Ahmedabad for business, career, and Kundli matching.'
    },
    jaipur: {
        name: 'Jaipur',
        state: 'Rajasthan',
        description: 'Renowned Vedic astrologers and gemstone advisors in Jaipur available for online Kundli analysis, career decisions, and marriage matching.'
    },
    lucknow: {
        name: 'Lucknow',
        state: 'Uttar Pradesh',
        description: 'Experienced Jyotish scholars and Vedic palmists in Lucknow offering authentic Kundali Milan, horoscope readings, and remedies.'
    },
    chandigarh: {
        name: 'Chandigarh',
        state: 'Punjab & Haryana',
        description: 'Top online astrologers and tarot card readers in Chandigarh for NRI relationship advice, career timing, and birth chart analysis.'
    },
    indore: {
        name: 'Indore',
        state: 'Madhya Pradesh',
        description: 'Verified Vedic astrologers in Indore specializing in business Kundli analysis, financial transits, and marriage compatibility.'
    },
    patna: {
        name: 'Patna',
        state: 'Bihar',
        description: 'Traditional Vedic Jyotish experts in Patna available 24/7 for Janam Kundli readings, Manglik Dosha remedies, and government job timings.'
    },
    surat: {
        name: 'Surat',
        state: 'Gujarat',
        description: 'Trusted online Vedic astrologers in Surat for business partnerships, career growth, Kundli matching, and Vastu Shastra.'
    },
    kochi: {
        name: 'Kochi',
        state: 'Kerala',
        description: 'Authentic Kerala astrology and Prashna Jyotish experts in Kochi for instant online consultations and accurate life predictions.'
    },
    varanasi: {
        name: 'Varanasi',
        state: 'Uttar Pradesh',
        description: 'Kashi-trained Vedic Jyotish Acharyas and Vedic scholars in Varanasi offering genuine Kundli analysis and spiritual remedies.'
    },
    nagpur: {
        name: 'Nagpur',
        state: 'Maharashtra',
        description: 'Consult top-rated Vedic astrologers and numerologists in Nagpur for private chat consultations and birth chart insights.'
    },
    bhopal: {
        name: 'Bhopal',
        state: 'Madhya Pradesh',
        description: 'Experienced Vedic astrologers in Bhopal offering personalized horoscope analysis, career forecasting, and marital compatibility.'
    },
    coimbatore: {
        name: 'Coimbatore',
        state: 'Tamil Nadu',
        description: 'Trusted Vedic and Nadi astrologers in Coimbatore for instant online consultations on business, marriage, and family health.'
    },
    ludhiana: {
        name: 'Ludhiana',
        state: 'Punjab',
        description: 'Leading Vedic astrologers and tarot consultants in Ludhiana for overseas travel, marriage matching, and business growth.'
    },
    gurgaon: {
        name: 'Gurgaon',
        state: 'Haryana',
        description: 'Top corporate and Vedic astrologers in Gurgaon (Gurugram) for executive career guidance, startup timing, and relationship advice.'
    },
    noida: {
        name: 'Noida',
        state: 'Uttar Pradesh',
        description: 'Consult expert Vedic astrologers in Noida for instant 24/7 chat on career change, marriage compatibility, and daily horoscopes.'
    },
    dubai: {
        name: 'Dubai',
        state: 'UAE',
        description: 'Connect with top Indian Vedic astrologers online from Dubai, UAE for confidential Kundli matching, career timing, and business Jyotish.'
    },
    london: {
        name: 'London',
        state: 'United Kingdom',
        description: 'Consult authentic Indian Vedic astrologers online from London, UK for NRI relationship guidance, marriage Kundli matching, and career readings.'
    },
    toronto: {
        name: 'Toronto',
        state: 'Canada',
        description: 'Indian Vedic astrology consultations online in Toronto, Canada for immigration prospects, career timing, and Kundali Milan.'
    },
    singapore: {
        name: 'Singapore',
        state: 'Singapore',
        description: 'Online Vedic astrologer consultations in Singapore for business prosperity, marriage matching, and Vedic birth chart insights.'
    },
    'new-york': {
        name: 'New York',
        state: 'United States',
        description: 'Connect with verified Vedic astrologers online from New York, USA for personalized chart analysis, love compatibility, and career timing.'
    },
    sydney: {
        name: 'Sydney',
        state: 'Australia',
        description: 'Consult experienced Indian Vedic astrologers online from Sydney, Australia for private Kundli readings and relationship advice.'
    }
};

const CityAstrologers: React.FC = () => {
    const { cityName = 'delhi' } = useParams<{ cityName: string }>();
    const normalizedKey = cityName.toLowerCase().trim();
    const cityInfo = CITY_MAP[normalizedKey] || {
        name: cityName.charAt(0).toUpperCase() + cityName.slice(1),
        state: 'India',
        description: `Consult top verified Vedic astrologers in ${cityName} for online chat consultations, Kundli matching, and remedies from ₹10/min.`
    };

    const formattedTitle = `Top Astrologers in ${cityInfo.name} | Aadikarta`;
    const canonicalPath = `/astrologers/city/${normalizedKey}`;

    const faqs = [
        {
            question: `How can I consult an astrologer in ${cityInfo.name} online?`,
            answer: `You can instantly browse verified Vedic astrologers in ${cityInfo.name} on Aadikarta, select an expert, and start a 100% private chat or call consultation starting from ₹10/min.`
        },
        {
            question: `Are astrologers in ${cityInfo.name} available 24/7?`,
            answer: `Yes, Aadikarta provides 24/7 online availability with verified astrologers speaking Hindi, English, and regional languages.`
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
                name: `Best Astrologers in ${cityInfo.name} — Aadikarta Vedic Astrology`,
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
            />
            <Header />

            <main id="main-content" className="pt-8 pb-16">
                <div className="container mx-auto px-4">
                    <PageHeading
                        eyebrow={`Verified Experts in ${cityInfo.name}`}
                        title={<>Top <span className="text-amber-500">Astrologers</span> in {cityInfo.name}</>}
                        subtitle={cityInfo.description}
                    />

                    <AeoDirectAnswer
                        question={`How to find the best online Vedic astrologer in ${cityInfo.name}?`}
                        answer={`On Aadikarta, you can view verified profiles, experience years, specializations, and user ratings for top Vedic astrologers in ${cityInfo.name}. Instant private chat consultations start from ₹10/min.`}
                        keyTakeaways={[
                            { label: "Verification", text: "Rigorous 4-step Screening Process" },
                            { label: "Starting Rate", text: "From ₹10/minute" },
                            { label: "Availability", text: "24/7 Instant Live Chat & Call" },
                            { label: "Privacy", text: "100% Encrypted & Confidential" }
                        ]}
                    />

                    <div className="mt-8">
                        <AstrologerList />
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
