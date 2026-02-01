import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const Disclaimer: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Disclaimer"
                description="Read Aadikarta's disclaimer regarding astrological services and content provided on the platform."
            />
            <Header />
            <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-8 text-center">Disclaimer</h1>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <p>
                        AadiKarta is a platform that facilitates astrological consultations between astrologers and seekers. All content, consultations, predictions, and advice provided on this platform are based on personal beliefs, traditional practices, and the experience of individual astrologers.
                    </p>

                    <ul className="list-disc pl-6 space-y-2">
                        <li>We do not guarantee the accuracy, completeness, or effectiveness of any prediction or advice</li>
                        <li>Astrology is not a science and should be used for guidance purposes only</li>
                        <li>AadiKarta is not responsible for decisions made by users based on consultations</li>
                        <li>We do not provide medical, legal, financial, or psychological advice</li>
                    </ul>

                    <p className="pt-4 font-semibold">
                        Users are advised to exercise personal judgment and discretion while using the platform.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Disclaimer;
