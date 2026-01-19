import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import AstrologerList from '../components/AstrologerList';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const Home: React.FC = () => {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Aadikarta",
        "url": "https://aadikarta.org",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://aadikarta.org/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <div className="home-page pb-20 md:pb-0">
            <SEO
                title="Home"
                description="Discover your destiny with Aadikarta. Connect with expert astrologers for personalized readings, daily horoscopes, and spiritual guidance."
                structuredData={structuredData}
            />
            <Header />
            <Hero />
            <HowItWorks />
            <AstrologerList limit={6} topRankingOnly={true} showFilters={false} />

            <section className="promise-section py-20 bg-indigo-50 text-center">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                            Our Promise to You
                        </h2>
                        <p className="text-gray-600">We are committed to authenticity, privacy, and satisfaction.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                            <div className="text-4xl mb-6 bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center">🔒</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">100% Privacy</h3>
                            <p className="text-gray-600 leading-relaxed">Your personal details and conversations are kept strictly confidential. We use encryption to protect your data.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                            <div className="text-4xl mb-6 bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center">✅</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Astrologers</h3>
                            <p className="text-gray-600 leading-relaxed">Every astrologer undergoes a rigorous screening process. We ensure only genuine experts join our platform.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                            <div className="text-4xl mb-6 bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center">💰</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Money Back Guarantee</h3>
                            <p className="text-gray-600 leading-relaxed">Not satisfied with your consultation? We offer a hassle-free refund policy. Your satisfaction is our priority.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Testimonials />
            <Footer />
        </div>
    );
};

export default Home;
