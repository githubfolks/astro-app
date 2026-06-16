import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const RefundPolicy: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Refund Policy"
                description="Understand Aadikarta's refund policy, eligibility criteria, and process for requesting refunds."
            />
            <Header />
            <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-8 text-center">Refund Policy</h1>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <p>
                        AadiKarta follows a transparent and fair refund policy.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Eligibility for Refund</h2>
                    <p>Refunds may be considered only under the following circumstances:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Payment deducted but consultation not delivered</li>
                        <li>Technical failure from our platform resulting in incomplete service</li>
                        <li>Duplicate or accidental payment</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Non-Refundable Cases</h2>
                    <p>Refunds are not applicable in cases where:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Consultation has already been completed</li>
                        <li>User dissatisfaction with prediction or advice</li>
                        <li>Delay or non-response caused by incorrect user information</li>
                        <li>Change of mind after booking</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Refund Process</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Refund requests must be raised within 48 hours of the transaction</li>
                        <li>Approved refunds will be processed within 7–10 working days</li>
                        <li>Refunds will be credited to the original payment method</li>
                    </ul>

                    <p className="pt-4 font-semibold">
                        AadiKarta reserves the right to approve or reject refund requests after review.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default RefundPolicy;
