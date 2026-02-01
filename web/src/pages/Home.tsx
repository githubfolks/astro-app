import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import AstrologerList from '../components/AstrologerList';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import Services from '../components/Services';

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
            <AstrologerList limit={10} topRankingOnly={false} showFilters={true} />
            <Services />

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

            <section className="join-astrologer-section py-20 bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-center">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                            Are You an Expert Astrologer?
                        </h2>
                        <p className="text-xl mb-10 opacity-90">
                            Join India's fastest growing astrology platform. Connect with millions of seekers and share your wisdom with the world.
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                            <Link
                                to="/join-as-astrologer"
                                className="bg-white text-indigo-700 hover:bg-indigo-50 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all hover:-translate-y-1"
                            >
                                Join as Astrologer
                            </Link>
                            <Link
                                to="/about-us"
                                className="bg-transparent border-2 border-white/30 hover:border-white text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
