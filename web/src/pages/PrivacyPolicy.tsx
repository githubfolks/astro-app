import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Privacy Policy"
                description="Read Aadikarta's Privacy Policy to understand how we collect, use, and protect your personal information."
            />
            <Header />
            <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-8 text-center">Privacy Policy</h1>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <p>
                        At AadiKarta, your privacy is extremely important to us. This Privacy Policy explains how we collect, use, store, and protect your information.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Information We Collect</h2>
                    <p>We may collect the following information:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Personal details such as name, email address, phone number</li>
                        <li>Birth details provided for astrological purposes (date, time, place of birth)</li>
                        <li>Payment and transaction details (processed via secure third-party gateways)</li>
                        <li>Technical data such as IP address, browser type, and device information</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Provide astrological consultation services</li>
                        <li>Connect seekers with astrologers</li>
                        <li>Process payments and refunds</li>
                        <li>Improve platform functionality and user experience</li>
                        <li>Communicate important updates and service information</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Data Protection</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>We do not sell or rent your personal data to third parties</li>
                        <li>All sensitive information is protected using industry-standard security practices</li>
                        <li>Payment information is handled only by trusted payment gateway providers</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Third-Party Services</h2>
                    <p>
                        AadiKarta may use third-party tools for analytics, communication, and payments. These providers are bound by their own privacy policies.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Your Consent</h2>
                    <p>
                        By using our platform, you consent to the collection and use of information as described in this policy.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
