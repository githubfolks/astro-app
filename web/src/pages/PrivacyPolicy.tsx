import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useSupportContact } from '../hooks/useSupportContact';

const PrivacyPolicy: React.FC = () => {
    const { support_email, support_phone } = useSupportContact();
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
                    <p className="text-sm text-gray-900">Last Updated: July 9, 2026</p>

                    <p>
                        At AadiKarta (accessible at aadikarta.org), protecting the privacy of our seekers and astrologers is our highest priority. This Privacy Policy explains how we collect, use, store, and protect your information. By accessing or using our platform, you accept the practices described in this policy.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Information We Collect</h2>
                    <p>We may collect the following information:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Personal details such as name, email address, phone number, gender, and profile picture</li>
                        <li>Birth details provided for astrological purposes, such as date, time, and place of birth (used to generate Kundli, compatibility, and career reports, and personalized horoscopes)</li>
                        <li>Chat and consultation history between seekers and astrologers, retained for quality audits, dispute resolution, and AI-assisted consultation summaries</li>
                        <li>Payment and transaction details, including wallet recharge and payout history (processed via secure, PCI-DSS compliant gateways such as Razorpay; we do not store your card or bank account numbers)</li>
                        <li>Technical data such as IP address, device type, operating system, browser type, and connection logs</li>
                        <li>Cookies and similar tracking technologies used to keep you signed in, remember your preferences, and understand how the platform is used</li>
                        <li>Astrologer Onboarding Data: for users registering as astrologers, we additionally collect ID proof, professional credentials, and bank/UPI payout details as part of the verification process</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Provide astrological consultation services and connect seekers with verified astrologers</li>
                        <li>Calculate live chat/call duration and billing on a per-minute or package basis</li>
                        <li>Generate personalized horoscopes, Kundli reports, compatibility charts, and auspicious timings</li>
                        <li>Process payments, wallet top-ups, payouts, and refunds</li>
                        <li>Send transaction alerts, low-balance warnings, referral notifications, and booking reminders</li>
                        <li>Generate tax invoices (including Indian GST) and audit transaction history for legal compliance</li>
                        <li>Improve platform functionality, security, and user experience</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Cookies</h2>
                    <p>
                        We use cookies and similar technologies to keep you logged in, remember your preferences, and analyze site traffic. You can control or disable cookies through your browser settings, though some parts of the platform may not function properly without them.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Data Retention</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Profile and account data is retained for as long as your account remains active</li>
                        <li>Chat and consultation history is retained for up to 3 years after your last activity, to support dispute resolution and quality audits</li>
                        <li>Financial and transaction records are retained as required under Indian tax and GST recordkeeping law</li>
                        <li>If you request account deletion, we delete or anonymize your personal data within a reasonable period, except where retention is required by law</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Data Protection</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>We do not sell, rent, or trade your personal data or consultation history to third parties</li>
                        <li>Live chat transmissions and stored data are protected using industry-standard SSL/TLS encryption</li>
                        <li>All verified astrologers on AadiKarta are bound by confidentiality obligations regarding seeker details</li>
                        <li>While we use reasonable technical and organizational safeguards, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Third-Party Services and Links</h2>
                    <p>
                        AadiKarta uses trusted third-party services for payments (Razorpay), video/audio consultations (MiroTalk SFU), analytics, and communications. Our platform may also contain links to external websites; we are not responsible for the privacy practices or content of those third-party sites, and encourage you to review their policies separately.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Your Rights</h2>
                    <p>Subject to applicable law, you have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Access, review, and correct the personal information we hold about you</li>
                        <li>Withdraw consent for the processing of your data at any time</li>
                        <li>Object to your data being used for marketing communications</li>
                        <li>Request deletion of your account and associated personal data</li>
                        <li>Lodge a complaint with the relevant data protection authority</li>
                    </ul>
                    <p>
                        You can update your profile details at any time from your account settings, or exercise any of the above rights by contacting our Grievance Officer at {support_email}{support_phone ? ` or ${support_phone}` : ''}. We will acknowledge your request within 48 hours and aim to resolve it within 30 days.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Children's Privacy</h2>
                    <p>
                        Our platform is intended for users who are at least 18 years old and is not directed at children. We do not knowingly collect personal information from anyone under 13. If we become aware that we have inadvertently collected such information, we will delete it promptly upon notification.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. The updated policy will be posted on this page with a revised "Last Updated" date, and your continued use of the platform after such changes constitutes acceptance of the revised policy.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Your Consent</h2>
                    <p>
                        By registering an account and using the AadiKarta platform, you consent to the collection and processing of your information as described in this policy. For any privacy-related questions or requests, contact us at {support_email}.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
