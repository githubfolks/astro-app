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
                    <p className="text-sm text-gray-500">Last Updated: July 9, 2026</p>

                    <p>
                        AadiKarta (aadikarta.org) operates as an intermediary marketplace platform that facilitates real-time astrological consultations, Kundli matching, and related readings between independent astrologers and seekers. All content, consultations, predictions, and advice provided on this platform are based on personal beliefs, traditional practices, and the experience of individual astrologers.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Astrological Content and Predictions</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>We do not guarantee the accuracy, completeness, efficacy, or reliability of any prediction, planetary analysis, remedy, or advice provided by astrologers — it is offered for guidance and exploration only</li>
                        <li>Astrology is not considered an empirical science; results can vary, and no outcome is guaranteed by the platform</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">AI Astrologer ("Aadi")</h2>
                    <p>
                        Responses from our AI Astrologer feature ("Aadi") are generated automatically by an AI model based on the details you provide — they are not written or reviewed by a human astrologer. Aadi's responses can be inaccurate or incomplete and, like all content on this platform, are for guidance and entertainment purposes only.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Not Professional Advice</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Consultations on AadiKarta are not a substitute for professional services and must not be treated as medical diagnoses, legal opinions, financial/investment advice, or psychological counseling</li>
                        <li>For medical, legal, or financial decisions, please consult a qualified, licensed professional. AadiKarta is not liable for any actions, losses, or decisions taken based on consultations</li>
                        <li>AadiKarta is not responsible for decisions made by users based on consultations, and does not provide medical, legal, financial, or psychological advice</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Independent Astrologers</h2>
                    <p>
                        Astrologers on AadiKarta are independent service providers, not employees or agents of AadiKarta. Their views, statements, and interpretations are entirely their own and do not reflect the views of AadiKarta. Our verification process confirms an astrologer's identity and stated credentials — it is not an endorsement of the accuracy of their predictions.
                    </p>

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
