import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Mail, Phone, Send } from 'lucide-react';
import { api } from '../services/api';
import SEO from '../components/SEO';

const ContactUs: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: null, message: '' });

        try {
            await api.cms.contact({
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                message: formData.message
            });
            setStatus({ type: 'success', message: 'Thank you for your message! We will get back to you soon.' });
            setFormData({ firstName: '', lastName: '', email: '', message: '' });
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <SEO
                title="Contact Us"
                description="Get in touch with Aadikarta support. We are here to answer your questions and help you on your spiritual journey."
            />
            <Header />

            <main className="flex-1 container mx-auto px-4 py-20 md:py-32">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">Get in Touch</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Have questions or need assistance? We're here to help you on your spiritual journey.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                        {/* Left Side - Info & Illustration */}
                        <div className="w-full md:w-5/12 bg-indigo-600 p-10 md:p-12 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-8">Contact Information</h3>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-white/10 p-3 rounded-lg">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-indigo-200 text-sm mb-1">Email Us</p>
                                            <p className="font-semibold">support@aadikarta.org</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="bg-white/10 p-3 rounded-lg">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-indigo-200 text-sm mb-1">Call Us</p>
                                            <p className="font-semibold">+91 86503 54783</p>
                                        </div>
                                    </div>

                                    {/* <div className="flex items-start gap-4">
                                        <div className="bg-white/10 p-3 rounded-lg">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-indigo-200 text-sm mb-1">Visit Us</p>
                                            <p className="font-semibold">123 Cosmic Tower, Startown, India</p>
                                        </div>
                                    </div> */}
                                </div>
                            </div>

                            {/* Decorative Illustration */}
                            <div className="mt-12 relative flex justify-center z-10">
                                <img
                                    src="/assets/contact-illustration.png"
                                    alt="Customer Support"
                                    className="w-full max-w-[280px] object-contain drop-shadow-xl transform hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                            {/* Background Circles */}
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500 rounded-full opacity-50 blur-3xl"></div>
                        </div>

                        {/* Right Side - Form */}
                        <div className="w-full md:w-7/12 p-10 md:p-14">
                            <h3 className="text-2xl font-bold text-gray-900 mb-8">Send us a Message</h3>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-gray-50 focus:bg-white"
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-gray-50 focus:bg-white"
                                            placeholder="Doe"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-gray-50 focus:bg-white"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <textarea
                                        rows={4}
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                                        placeholder="How can we help you?"
                                        required
                                    ></textarea>
                                </div>

                                {status.message && (
                                    <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {status.message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? 'Sending...' : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ContactUs;
