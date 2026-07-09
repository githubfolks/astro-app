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
                    <p className="text-sm text-gray-900">Last Updated: July 9, 2026</p>

                    <p>
                        Welcome to AadiKarta. By registering an account, topping up your wallet, or using our live chat, call, or report consultation services, you agree to comply with the following terms and conditions. AadiKarta reserves the right to modify, update, or amend these terms at any time, and it is your responsibility to review this page periodically; continued use of the platform after changes are posted constitutes acceptance of the revised terms.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Eligibility and Account Security</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>You must be at least 18 years of age and legally capable of entering into a binding contract to register an account</li>
                        <li>Information provided, including birth date, time, and place, must be accurate and complete to ensure correct astrological calculations</li>
                        <li>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account, and must notify us immediately of any unauthorized access</li>
                        <li>Creating multiple accounts to abuse referral credits, free trials, or promotional offers is prohibited</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Wallet, Purchases, and Subscriptions</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>AadiKarta operates on a pre-paid virtual wallet; you must add credits via our secure payment gateways (e.g., Razorpay) before starting a session</li>
                        <li>You warrant that any payment instrument you use belongs to you and that sufficient funds are available for the transaction</li>
                        <li>Sessions are billed on a per-minute or package basis and automatically end when your wallet balance or package time is exhausted</li>
                        <li>Paid reports (such as Kundli, Compatibility, or Career Path reports) are generated digitally and delivered to your dashboard; once purchased, they are final and non-refundable</li>
                        <li>Subscription plans renew automatically until cancelled from your account dashboard</li>
                        <li>Prices shown are inclusive of applicable taxes, including Indian GST, as required by law</li>
                        <li>For refund eligibility and process, see our <a href="/refund-policy" className="text-orange-600 underline">Refund Policy</a></li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Astrologer Terms</h2>
                    <p>If you register on AadiKarta as an astrologer, tarot reader, numerologist, or Vastu consultant, the following also apply to you:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Joining is free; you go through a verification process (credentials and ID proof review, typically completed within 2–3 business days) before being listed</li>
                        <li>AadiKarta charges a 30% platform commission on completed paid consultations; the remainder is paid out to you</li>
                        <li>Payouts are processed weekly, every Monday, to your registered payout details</li>
                        <li>You are solely responsible for any tax obligations arising from your earnings on the platform</li>
                        <li>You must keep seeker information (birth details, chat history, contact information) confidential and must not use it outside the platform</li>
                        <li>You are an independent service provider, not an employee or agent of AadiKarta; your advice and opinions are your own</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">AI Astrologer ("Aadi")</h2>
                    <p>
                        Our AI Astrologer feature ("Aadi") generates responses automatically using an AI model and is not a human astrologer. Aadi's output is provided for guidance and entertainment purposes only, carries no guarantee of accuracy, and is subject to the same liability limitations as human astrologer consultations described in this document and our <a href="/disclaimer" className="text-orange-600 underline">Disclaimer</a>.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Courses and Classroom</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Paid courses and live classroom sessions are licensed to the enrolled user for personal, non-commercial use only and may not be recorded, redistributed, or resold</li>
                        <li>Course access is tied to your account and may not be shared with others</li>
                        <li>For cancellation and refund eligibility, see our <a href="/refund-policy" className="text-orange-600 underline">Refund Policy</a></li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">User Conduct and Prohibited Content</h2>
                    <p>You agree not to use the platform to post, transmit, or engage in:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Harassment, threats, obscene, or hateful language directed at astrologers or other users</li>
                        <li>Sexually explicit, violent, or otherwise unlawful content</li>
                        <li>Fraudulent, deceptive, or illegal activity, including attempts to exploit promotional offers</li>
                        <li>Sharing of personal contact or payment details with astrologers outside the platform</li>
                    </ul>
                    <p>
                        Violation of these guidelines may result in immediate suspension or termination of your account and forfeiture of remaining wallet credits.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Role of AadiKarta and Limitation of Liability</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>AadiKarta is an intermediary technology platform connecting seekers with independent astrologers</li>
                        <li>We do not edit, moderate, or take responsibility for the personal opinions, predictions, or remedies offered by astrologers, and services are provided on an "as is" and "as available" basis without warranties of accuracy or availability</li>
                        <li>We provide reasonable grace periods for app crashes or network drops but are not liable for direct or indirect losses arising from connectivity failures</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Intellectual Property</h2>
                    <p>
                        Kundli reports and personalized horoscope content generated on the platform are licensed to you for personal use only and may not be repackaged, resold, or redistributed.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Account Termination</h2>
                    <p>We reserve the right to suspend or terminate accounts for:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Violation of these terms</li>
                        <li>Fraudulent activities</li>
                        <li>Misuse of platform services</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Grievance Redressal</h2>
                    <p>
                        If you have a complaint or grievance regarding our services, please write to our Grievance Officer at support@aadikarta.org or call +91 86503 54783. We will acknowledge your complaint within 48 hours and aim to resolve it within 30 days.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">General</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>AadiKarta is not liable for any failure to perform obligations due to causes beyond our reasonable control, including natural disasters, internet or power outages, or government action</li>
                        <li>You agree to indemnify and hold AadiKarta harmless from any claims arising out of your misuse of the platform or violation of these terms</li>
                        <li>If any provision of these terms is found unenforceable, the remaining provisions will continue in full force</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-900 pt-4">Governing Law & Jurisdiction</h2>
                    <p>
                        These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of the use of this platform shall be subject to the exclusive jurisdiction of the competent courts of India.
                    </p>

                    <p>
                        If you do not agree to these terms, you must not use our website, wallet, or consult with astrologers on our network. For inquiries, email support@aadikarta.org.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
