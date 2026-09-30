import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useSupportContact } from '../hooks/useSupportContact';
import { useBusinessInfo } from '../hooks/useBusinessInfo';
import LegalEntityInfo from '../components/LegalEntityInfo';

const PrivacyPolicy: React.FC = () => {
    const { support_email } = useSupportContact();
    const { info } = useBusinessInfo();
    const retentionYears = info?.chat_retention_years || '…';
    const company = info?.company_legal_name || 'the company operating AadiKarta';
    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Privacy Policy | Aadikarta Vedic Astrology"
                description="Read Aadikarta Vedic Astrology's Privacy Policy to understand how we collect, use, and protect your personal birth details and information."
                keywords="Aadikarta Vedic Astrology privacy policy, data security Aadikarta, user privacy"
            />
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 md:py-16 max-w-4xl mb-4">
                <h1 className="text-2xl md:text-4xl text-gray-900 mt-4 mb-4 md:mb-8 text-center">Privacy Policy</h1>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <p className="text-sm text-gray-900">Last Updated: September 30, 2026</p>

                    <p>
                        AadiKarta (accessible at aadikarta.org and through our mobile apps) is operated by {company} ("we", "us"). Protecting the privacy of our seekers and astrologers is our highest priority. This Privacy Policy explains how we collect, use, store, share, and protect your personal data, in line with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000. By accessing or using our platform, you accept the practices described in this policy.
                    </p>
                    <LegalEntityInfo />

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">Information We Collect</h2>
                    <p>We may collect the following information:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Personal details such as name, email address, phone number, gender, and profile picture</li>
                        <li>Birth details provided for astrological purposes, such as date, time, and place of birth (used to generate Kundli, compatibility, and career reports, and personalized horoscopes)</li>
                        <li>Chat and consultation history between seekers and astrologers, including details you add to a consultation request (such as your concern and a partner's birth details), retained for quality audits and dispute resolution</li>
                        <li>Questions and birth details you submit to our AI Astrologer ("Aadi"), and — only if you request a callback and give consent — your name, phone number, and birth details</li>
                        <li>Payment and transaction details, including wallet recharge (with the GST charged) and payout history (processed via secure, PCI-DSS compliant gateways such as Razorpay; we do not store your card numbers)</li>
                        <li>Technical data such as IP address, device type, operating system, browser type, and connection logs</li>
                        <li>Cookies and similar tracking technologies used to keep you signed in, remember your preferences, and understand how the platform is used</li>
                        <li>Astrologer Onboarding Data: for users registering as astrologers, we additionally collect ID proof, professional credentials, and bank/UPI payout details as part of the verification process</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Provide astrological consultation services and connect seekers with verified astrologers</li>
                        <li>Calculate live chat/call duration and billing on a per-minute or package basis</li>
                        <li>Generate personalized horoscopes, Kundli reports, compatibility charts, and auspicious timings</li>
                        <li>Process payments, wallet top-ups, payouts, and refunds</li>
                        <li>Send transaction alerts, low-balance warnings, referral notifications, and booking reminders</li>
                        <li>Generate tax invoices (including Indian GST) and audit transaction history for legal compliance</li>
                        <li>Automatically scan chat messages to detect and mask phone numbers, contact details, and spam, which our administrators may review to enforce our Terms of Service</li>
                        <li>Improve platform functionality, security, and user experience</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">Cookies</h2>
                    <p>
                        We use cookies and similar technologies to keep you logged in, remember your preferences, and analyze site traffic. You can control or disable cookies through your browser settings, though some parts of the platform may not function properly without them.
                    </p>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">Data Retention</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Profile and account data is retained for as long as your account remains active</li>
                        <li>Chat messages and shared images are automatically deleted {retentionYears} years after the consultation ends, unless a dispute about that consultation is still open</li>
                        <li>Financial and transaction records are retained as required under Indian tax and GST recordkeeping law</li>
                        <li>When you delete your account, your personal data is erased or anonymized immediately, except records we must keep by law (such as transactions and invoices) and chat messages, which are deleted on the schedule above</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">Data Protection</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>We do not sell, rent, or trade your personal data or consultation history to third parties</li>
                        <li>Live chat transmissions and stored data are protected using industry-standard SSL/TLS encryption</li>
                        <li>All verified astrologers on AadiKarta are bound by confidentiality obligations regarding seeker details</li>
                        <li>While we use reasonable technical and organizational safeguards, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">Third-Party Services and Links</h2>
                    <p>We share only the data each service needs to perform its function for us:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Razorpay — payment processing for wallet recharges and report purchases</li>
                        <li>Groq — runs the AI model behind our AI Astrologer; receives your question and the birth details you provide</li>
                        <li>FreeAstroAPI — astrological chart calculations; receives birth date, time, and place</li>
                        <li>OpenStreetMap (Nominatim / Photon) — place search when you type a place of birth</li>
                        <li>Google — Google sign-in (if you choose it), Firebase Cloud Messaging for push notifications, and Google Tag Manager for site analytics</li>
                        <li>Resend — sending account and transaction emails</li>
                        <li>WhatsApp (via our messaging provider) — booking and availability alerts</li>
                    </ul>
                    <p>
                        Live classes run on our own MiroTalk video server. Some of these providers process data outside India; we transfer data abroad only as permitted under the Digital Personal Data Protection Act, 2023. Our platform may also contain links to external websites; we are not responsible for the privacy practices or content of those sites.
                    </p>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">Your Rights</h2>
                    <p>Under the Digital Personal Data Protection Act, 2023 and other applicable law, you have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Obtain a summary of the personal data we hold about you and how we process it</li>
                        <li>Correct, complete, or update your personal data</li>
                        <li>Withdraw consent for processing at any time (this does not affect processing already carried out)</li>
                        <li>Object to your data being used for marketing communications</li>
                        <li>Erase your personal data by deleting your account</li>
                        <li>Nominate another person to exercise these rights on your behalf in the event of your death or incapacity</li>
                        <li>Have your grievances addressed by our Grievance Officer, and if unresolved, complain to the Data Protection Board of India</li>
                    </ul>
                    <p>
                        You can update your profile at any time from your Dashboard. Seekers can delete their account from Dashboard &gt; Delete Account; deletion is available once your wallet balance is zero, no consultation is in progress, and no dispute is open (contact support if you need a refund of your remaining balance first). Astrologers can close their account by contacting support, so that pending payouts and tax records can be settled. To exercise any other right, contact our Grievance Officer using the details above. We will acknowledge your request within 48 hours and aim to resolve it within 30 days.
                    </p>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">Children's Privacy</h2>
                    <p>
                        Our platform is intended only for users who are at least 18 years old and is not directed at children. We do not knowingly collect personal data from anyone under 18. If we become aware that we have collected such data, we will delete it promptly.
                    </p>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. The updated policy will be posted on this page with a revised "Last Updated" date, and your continued use of the platform after such changes constitutes acceptance of the revised policy.
                    </p>

                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 pt-4">Your Consent</h2>
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
