import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { Home, Compass, Shield, Sun, Activity } from 'lucide-react';
import './ServicesDetail.css';

const vastuStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/vastu-shastra#service',
            name: 'Vastu Shastra Consultation Online',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Expert Vastu Shastra consultation for homes, offices, and plots from certified Vastu consultants. Room-by-room analysis, dosha remedies, and energy balancing to attract prosperity and peace.',
            areaServed: 'IN',
            offers: { '@type': 'Offer', priceCurrency: 'INR', price: '10', priceSpecification: { '@type': 'UnitPriceSpecification', price: '10', priceCurrency: 'INR', unitText: 'per minute' } },
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'What is Vastu Shastra?', acceptedAnswer: { '@type': 'Answer', text: 'Vastu Shastra is an ancient Indian science of architecture and spatial arrangement that aligns buildings with natural forces, the five elements (Pancha Bhuta), and cardinal directions to promote well-being and prosperity.' } },
                { '@type': 'Question', name: 'Can Vastu remedies be done without demolition?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, many Vastu doshas can be corrected without structural changes using remedies like mirrors, crystals, plants, color schemes, furniture placement, and yantras.' } },
                { '@type': 'Question', name: 'Which direction should the main door face according to Vastu?', acceptedAnswer: { '@type': 'Answer', text: 'North, northeast, or east-facing main doors are generally considered auspicious in Vastu Shastra. South and southwest-facing doors may require specific remedies.' } },
                { '@type': 'Question', name: 'How much does a Vastu consultation cost on Aadikarta?', acceptedAnswer: { '@type': 'Answer', text: 'Vastu consultations on Aadikarta start from ₹10 per minute. A full home or office Vastu analysis typically takes 30–60 minutes depending on the property size.' } },
            ],
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://aadikarta.org/astrologers' },
                { '@type': 'ListItem', position: 3, name: 'Vastu Shastra', item: 'https://aadikarta.org/services/vastu-shastra' },
            ],
        },
    ],
};

const VastuShastra: React.FC = () => {
    useEffect(() => {
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Vastu Shastra Consultation Online | Expert Vastu Advice"
                description="Expert Vastu Shastra consultation for home & office from certified consultants. Room analysis, dosha remedies & energy balancing. From ₹10/min."
                structuredData={vastuStructuredData}
            />
            <Header />
            
            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 text-center overflow-hidden min-h-[460px] flex flex-col items-center justify-center">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <span className="text-amber-500 font-normal uppercase tracking-widest text-sm mb-3 block">Service Details</span>
                    <h1 className="text-4xl md:text-6xl font-normal text-white mb-6">Vastu Shastra</h1>
                    <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                        Transform your living and working spaces into vessels of prosperity and peace.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                {/* Intro Section */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" data-aos="fade-up">
                    <div>
                        <span className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-amber-500 text-sm font-normal mb-6">
                            Ancient Science. Modern Spaces.
                        </span>
                        <h2 className="text-3xl font-normal text-white mb-6">
                            The Sacred Geometry of Your Home
                        </h2>
                        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                            <p>
                                Vastu Shastra is the metaphysical blueprint of living. By aligning your architecture with natural rhythms, we synchronize your space with the Earth.
                            </p>
                            <p>
                                Every compass point is a gateway to a specific planetary influence and one of the five elements. Balanced energies convert your home into a battery for success.
                            </p>
                        </div>
                    </div>
                    
                    <div className="service-glass-panel p-8" data-aos="fade-left">
                        <div className="grid grid-cols-3 gap-3 max-w-[360px] mx-auto">
                            {[
                                { dir: 'NW', el: 'Air' },
                                { dir: 'North', el: 'Water', active: true },
                                { dir: 'NE', el: 'Water' },
                                { dir: 'West', el: 'Air' },
                                { dir: 'Brahma', el: 'Space', active: true },
                                { dir: 'East', el: 'Fire' },
                                { dir: 'SW', el: 'Earth' },
                                { dir: 'South', el: 'Fire' },
                                { dir: 'SE', el: 'Fire' }
                            ].map((card, idx) => (
                                <div key={idx} className={`aspect-square flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all hover:-translate-y-1 shadow-sm ${card.active ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-white/5 border-white/5 text-gray-300'}`}>
                                    <span className="font-normal text-xs uppercase">{card.dir}</span>
                                    <span className="text-[9px] uppercase font-normal mt-1 px-1.5 py-0.5 rounded-full bg-white/5 text-gray-300">{card.el}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* The Five Elements */}
                <section className="service-glass-panel p-10 md:p-16 text-center" data-aos="zoom-in">
                    <h2 className="text-3xl font-normal text-white mb-16">The Five Elements — <span className="italic text-amber-500">Pancha Bhoota</span></h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {[
                            { name: 'Water', sanskrit: 'Jala', desc: 'North / NE flow' },
                            { name: 'Fire', sanskrit: 'Agni', desc: 'SE kitchen zone' },
                            { name: 'Earth', sanskrit: 'Prithvi', desc: 'SW stability' },
                            { name: 'Air', sanskrit: 'Vayu', desc: 'NW movement' },
                            { name: 'Space', sanskrit: 'Akasha', desc: 'Brahmasthan' }
                        ].map((element, idx) => (
                            <div key={idx} className="flex flex-col items-center p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all">
                                <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-xl mb-4 font-normal">
                                    {element.name[0]}
                                </div>
                                <span className="font-normal text-white text-base">{element.name}</span>
                                <span className="text-[10px] uppercase tracking-wider text-amber-500 font-normal mt-1">{element.sanskrit}</span>
                                <span className="text-[11px] text-gray-400 mt-2 text-center">{element.desc}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Geometry of Success */}
                <section className="service-glass-panel p-10 md:p-16 relative overflow-hidden" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px]"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-normal text-white mb-12">The Geometry of Success</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: <Home size={24} />, title: 'Entrance Power', desc: 'The main entry is the "mouth" of your home. We ensure it\'s positioned for prosperity.' },
                                { icon: <Activity size={24} />, title: 'Energy Balancing', desc: 'Harmonize zones for sleep, work, and nourishment to remove stagnant blocks.' },
                                { icon: <Sun size={24} />, title: 'Wealth Zones', desc: 'Optimize the North and NE corners to amplify financial stability and growth.' }
                            ].map((box, idx) => (
                                <div key={idx} className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/5 transition-all hover:bg-white/10 text-left">
                                    <div className="text-amber-500 mb-4">{box.icon}</div>
                                    <h3 className="text-xl font-normal text-white mb-3">{box.title}</h3>
                                    <p className="text-gray-300 font-light leading-relaxed">{box.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features list */}
                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl font-normal text-white mb-6">Expert Vastu Consultancy</h2>
                    <div className="grid md:grid-cols-2 gap-10 text-left mt-16">
                        {[
                            { icon: <Compass size={24} />, title: 'Design & Blueprint Audits', desc: 'Detailed review of floor plans for upcoming constructions to ensure a \'Vastu-perfect\' start.' },
                            { icon: <Shield size={24} />, title: 'No-Demolition Remedies', desc: 'Correct structural defects using colors and strategic placements without breaking a single wall.' }
                        ].map((item, idx) => (
                            <div key={idx} className="custom-list-item">
                                <div className="icon-box">{item.icon}</div>
                                <div>
                                    <h4 className="text-xl font-normal text-white mb-2">{item.title}</h4>
                                    <p className="text-gray-300 font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link to="/astrologers" className="inline-block mt-20 bg-amber-500 text-indigo-950 px-16 py-5 rounded-full font-normal text-xl shadow-xl shadow-amber-500/10 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all">
                        Consult a Vastu Expert
                    </Link>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default VastuShastra;
