import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Layers, Home as HomeIcon, HeartHandshake, CalendarDays, Star, AlertTriangle, Grid3x3, Hash, FileHeart, Sparkles, ScrollText } from 'lucide-react';
import { SERVICES_LIST } from '../data/servicesList';

const ICONS_AND_COLORS: Record<string, { icon: React.ReactNode; color: string }> = {
    'Free AI Astrologer': { icon: <Sparkles size={28} />, color: 'from-amber-400 via-yellow-500 to-amber-600' },
    'Free Daily Horoscope': { icon: <Sun size={28} />, color: 'from-yellow-400 to-amber-500' },
    'Free Kundli Generator': { icon: <FileHeart size={28} />, color: 'from-rose-400 to-purple-500' },
    'Free Kundli Matching': { icon: <HeartHandshake size={28} />, color: 'from-red-400 to-pink-500' },
    'Free Daily Panchang': { icon: <CalendarDays size={28} />, color: 'from-indigo-400 to-violet-500' },
    'Free Manglik Checker': { icon: <AlertTriangle size={28} />, color: 'from-red-500 to-orange-600' },
    'Free Navamsa (D9) Chart': { icon: <Grid3x3 size={28} />, color: 'from-fuchsia-400 to-purple-600' },
    'Free Numerology Calculator': { icon: <Hash size={28} />, color: 'from-sky-400 to-blue-600' },
    'AI Instant Reports': { icon: <ScrollText size={28} />, color: 'from-amber-500 to-orange-600' },
    'Vedic Astrology Consultation': { icon: <Star size={28} />, color: 'from-amber-400 to-yellow-500' },
    'Tarot Reading Consultation': { icon: <Layers size={28} />, color: 'from-purple-400 to-indigo-500' },
    'Vastu Shastra Consultation': { icon: <HomeIcon size={28} />, color: 'from-emerald-400 to-teal-500' },
    'Love Advice Consultation': { icon: <HeartHandshake size={28} />, color: 'from-rose-400 to-pink-500' },
};

const services = SERVICES_LIST.map((s) => ({ ...s, ...ICONS_AND_COLORS[s.title] }));

const ServicesGrid: React.FC = () => {
    return (
        <section className="services-grid-section py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto mb-16 text-center" data-aos="fade-up">
                    <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Explore</span>
                    <h2 className="text-3xl md:text-4xl text-gray-900 mb-6">
                        All Our <span className="text-indigo-600">Services</span>
                    </h2>
                    <p className="text-xl text-gray-600 leading-relaxed">Everything you need for guidance on love, career, health, and life &mdash; in one place.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {services.map((service, idx) => (
                        <Link
                            key={service.title}
                            to={service.to}
                            className="group flex flex-col items-center text-center p-6 rounded-3xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                            data-aos="fade-up"
                            data-aos-delay={idx * 50}
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                                {service.icon}
                            </div>
                            <h3 className="font-semibold text-gray-900">{service.title}</h3>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicesGrid;
