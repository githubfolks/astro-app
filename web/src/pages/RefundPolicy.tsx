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
                    <p className="text-sm text-gray-900">Last Updated: July 9, 2026</p>

                    <p>
                        AadiKarta is committed to a transparent, fair, and automated billing process. Because our platform runs on a real-time, server-side wallet deduction engine, we've set out clear rules below for when a refund or wallet credit applies.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">How Chat Billing Works</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Your wallet is not billed the moment a chat is requested — billing starts only when the astrologer sends the first message</li>
                        <li>If an astrologer accepts a chat but never replies, no balance is deducted</li>
                        <li>A session automatically ends the moment your wallet balance reaches zero or your purchased time package is exhausted</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Eligibility for Refund</h2>
                    <p>You're eligible for a refund or pro-rated wallet credit if:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>An astrologer accepts your chat but never sends a single message — the session is cancelled and no credits are deducted</li>
                        <li>A verified platform-side technical failure (server disconnection, WebSocket crash, or system error) cuts the session short</li>
                        <li>A session ends early due to a verified astrologer-side disconnection or network failure — you're only charged for the seconds actually elapsed, and the remaining balance stays in your wallet</li>
                        <li>You were billed twice for a single wallet top-up due to a payment gateway error — the duplicate charge is refunded to your original payment source</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Non-Refundable Cases</h2>
                    <p>Refunds are not applicable in cases where:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>A consultation has already been successfully delivered and completed</li>
                        <li>You're dissatisfied with a prediction, advice, or remedy — astrology is a guidance system based on traditional practice and individual interpretation, not an exact outcome we can guarantee</li>
                        <li>Incorrect predictions or reports result from inaccurate birth details you provided</li>
                        <li>A slight delay in an astrologer accepting a request, where the consultation was eventually completed</li>
                        <li>Paid digital reports (Full Kundli, Compatibility, Career Path) — once generated or delivered to your dashboard, these are final and non-refundable</li>
                        <li>Active subscription fees for the current billing cycle — you can cancel future renewal at any time, but the current cycle is non-refundable</li>
                        <li>Promotional or referral credits (free-trial minutes, coupon codes, referral bonuses) — these have no cash value and cannot be refunded or exchanged for cash</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Courses and Classroom Enrollments</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>A full refund is available if you cancel your enrollment at least 24 hours before the batch or class start date</li>
                        <li>Once a course has commenced, or once you have accessed any live class or downloadable course material, the enrollment fee becomes non-refundable</li>
                        <li>If a scheduled class is cancelled or not delivered due to a platform-side issue, you'll be offered a make-up session or a refund for that class</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Refund Process</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Refund or dispute claims must be raised within 48 hours of the transaction by emailing support@aadikarta.org with your transaction ID and (for chats) chat ID</li>
                        <li>Verified refunds for payment gateway failures are processed within 7–10 working days to your original payment source</li>
                        <li>Wallet credit adjustments are applied immediately once approved by our support team</li>
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
