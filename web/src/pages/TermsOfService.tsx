import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const TermsOfService: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Terms of Service"
                description="Review the Terms of Service for using Aadikarta's platform and services."
            />
            <Header />
            <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-8 text-center">Terms of Service</h1>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <p>
                        By accessing or using AadiKarta, you agree to the following terms and conditions:
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Platform Usage</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Users must be 18 years or older</li>
                        <li>Information provided must be accurate and complete</li>
                        <li>Misuse, abuse, or harassment of astrologers or users is strictly prohibited</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Role of AadiKarta</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>AadiKarta acts only as a technology platform</li>
                        <li>We do not control or influence astrologers’ opinions or advice</li>
                        <li>We are not liable for outcomes of consultations</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Payments</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>All payments must be made through approved payment gateways</li>
                        <li>Prices and services may change without prior notice</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Account Termination</h2>
                    <p>We reserve the right to suspend or terminate accounts for:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Violation of terms</li>
                        <li>Fraudulent activities</li>
                        <li>Misuse of platform services</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Limitation of Liability</h2>
                    <p>
                        AadiKarta shall not be liable for any direct or indirect loss arising from use of the platform.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Governing Law</h2>
                    <p>
                        These terms shall be governed by the laws of India.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
