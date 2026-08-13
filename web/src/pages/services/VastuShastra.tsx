import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageHeading from '../../components/PageHeading';
import SEO from '../../components/SEO';
import FAQSection from '../../components/FAQSection';
import { Home, Compass, Shield, Sun, Activity, Wind, Droplet, Flame, Mountain, Sparkles } from 'lucide-react';
import './ServicesDetail.css';

const faqs = [
    { question: 'What is Vastu Shastra?', answer: 'Vastu Shastra is an ancient Indian science of architecture and spatial arrangement that aligns buildings with natural forces, the five elements (Pancha Bhuta), and cardinal directions to promote well-being and prosperity.' },
    { question: 'Can Vastu remedies be done without demolition?', answer: 'Yes, many Vastu doshas can be corrected without structural changes using remedies like mirrors, crystals, plants, color schemes, furniture placement, and yantras.' },
    { question: 'Which direction should the main door face according to Vastu?', answer: 'North, northeast, or east-facing main doors are generally considered auspicious in Vastu Shastra. South and southwest-facing doors may require specific remedies.' },
    { question: 'How much does a Vastu consultation cost on Aadikarta Vedic Astrology?', answer: 'Vastu consultations on Aadikarta Vedic Astrology start from ₹10 per minute. A full home or office Vastu analysis typically takes 30–60 minutes depending on the property size.' },
];

const vastuStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/vastu-shastra#service',
            name: 'Vastu Shastra Consultation Online on Aadikarta Vedic Astrology',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Expert Vastu Shastra consultation for homes, offices, and plots on Aadikarta Vedic Astrology from certified Vastu consultants. Room analysis, dosha remedies, and energy balancing.',
            areaServed: 'IN',
            offers: { '@type': 'Offer', priceCurrency: 'INR', price: '10', priceSpecification: { '@type': 'UnitPriceSpecification', price: '10', priceCurrency: 'INR', unitText: 'per minute' } },
        },
        {
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer }
            }))
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
                title="Vastu Shastra Consultation Online | Vastu Advice | Aadikarta"
                description="Expert Vastu Shastra consultation for home & office on Aadikarta from certified consultants. Room layout analysis, remedies & energy balancing. From ₹10/min."
                keywords="Aadikarta Vedic Astrology, Vastu Shastra online, Vastu consultation Aadikarta, home Vastu remedies, Vastu expert chat"
                structuredData={vastuStructuredData}
            />
            <Header />
            
            {/* Hero Section */}
            <header className="relative pt-8 pb-6 md:pt-16 md:pb-12 px-6 text-center overflow-hidden">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <PageHeading
                        eyebrow="Service Details"
                        title="Vastu Shastra"
                        subtitle="Transform your living and working spaces into vessels of prosperity and peace."
                    />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 md:py-12 space-y-12 md:space-y-24">
                {/* Intro Section */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-center" data-aos="fade-up">
                    <div>
                        <span className="inline-block px-3 py-1 md:px-4 rounded-full bg-white/5 border border-white/10 text-amber-500 text-xs md:text-sm font-normal mb-3 md:mb-6">
                            Ancient Science. Modern Spaces.
                        </span>
                        <h2 className="text-2xl md:text-3xl font-normal text-white mb-3 md:mb-6">
                            The Sacred Geometry of Your Home
                        </h2>
                        <div className="space-y-3 md:space-y-4 text-gray-300 text-sm md:text-lg leading-relaxed">
                            <p>
                                Vastu Shastra is the metaphysical blueprint of living. By aligning your architecture with natural rhythms, we synchronize your space with the Earth.
                            </p>
                            <p>
                                Every compass point is a gateway to a specific planetary influence and one of the five elements. Balanced energies convert your home into a battery for success.
                            </p>
                        </div>
                    </div>

                    <div className="service-glass-panel p-5 md:p-8" data-aos="fade-left">
                        <div className="grid grid-cols-3 gap-3 max-w-[360px] mx-auto">
                            {[
                                { dir: 'NW', hindi: 'वायव्य', el: 'Air', icon: <Wind size={16} /> },
                                { dir: 'North', hindi: 'उत्तर', el: 'Water', active: true, icon: <Droplet size={16} /> },
                                { dir: 'NE', hindi: 'ईशान', el: 'Water', icon: <Droplet size={16} /> },
                                { dir: 'West', hindi: 'पश्चिम', el: 'Air', icon: <Wind size={16} /> },
                                { dir: 'Brahma', hindi: 'ब्रह्म', el: 'Space', active: true, icon: <Sparkles size={16} /> },
                                { dir: 'East', hindi: 'पूर्व', el: 'Fire', icon: <Flame size={16} /> },
                                { dir: 'SW', hindi: 'नैऋत्य', el: 'Earth', icon: <Mountain size={16} /> },
                                { dir: 'South', hindi: 'दक्षिण', el: 'Fire', icon: <Flame size={16} /> },
                                { dir: 'SE', hindi: 'आग्नेय', el: 'Fire', icon: <Flame size={16} /> }
                            ].map((card, idx) => (
                                <div key={idx} className={`aspect-square flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all hover:-translate-y-1 shadow-sm ${card.active ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-white/5 border-white/5 text-gray-300'}`}>
                                    <div className="mb-1">{card.icon}</div>
                                    <span className="font-normal text-xs uppercase">{card.dir}</span>
                                    <span className="text-[10px] font-normal opacity-80">{card.hindi}</span>
                                    <span className="text-[9px] uppercase font-normal mt-1 px-1.5 py-0.5 rounded-full bg-white/5 text-gray-300">{card.el}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* The Five Elements */}
                <section className="service-glass-panel p-5 md:p-16 text-center" data-aos="zoom-in">
                    <h2 className="text-xl md:text-3xl font-normal text-white mb-6 md:mb-16">The Five Elements — <span className="italic text-amber-500">Pancha Bhoota</span></h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6">
                        {[
                            { name: 'Water', sanskrit: 'Jala', desc: 'North / NE flow' },
                            { name: 'Fire', sanskrit: 'Agni', desc: 'SE kitchen zone' },
                            { name: 'Earth', sanskrit: 'Prithvi', desc: 'SW stability' },
                            { name: 'Air', sanskrit: 'Vayu', desc: 'NW movement' },
                            { name: 'Space', sanskrit: 'Akasha', desc: 'Brahmasthan' }
                        ].map((element, idx) => (
                            <div key={idx} className="flex flex-col items-center p-3 md:p-6 bg-white/5 border border-white/5 rounded-xl md:rounded-2xl hover:border-amber-500/30 transition-all">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-base md:text-xl mb-2 md:mb-4 font-normal">
                                    {element.name[0]}
                                </div>
                                <span className="font-normal text-white text-sm md:text-base">{element.name}</span>
                                <span className="text-[10px] uppercase tracking-wider text-amber-500 font-normal mt-1">{element.sanskrit}</span>
                                <span className="text-[11px] text-gray-400 mt-2 text-center">{element.desc}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Geometry of Success */}
                <section className="service-glass-panel p-5 md:p-16 relative overflow-hidden" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px]"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-xl md:text-3xl font-normal text-white mb-5 md:mb-12">The Geometry of Success</h2>
                        <div className="grid md:grid-cols-3 gap-3 md:gap-8">
                            {[
                                { icon: <Home size={24} />, title: 'Entrance Power', desc: 'The main entry is the "mouth" of your home. We ensure it\'s positioned for prosperity.' },
                                { icon: <Activity size={24} />, title: 'Energy Balancing', desc: 'Harmonize zones for sleep, work, and nourishment to remove stagnant blocks.' },
                                { icon: <Sun size={24} />, title: 'Wealth Zones', desc: 'Optimize the North and NE corners to amplify financial stability and growth.' }
                            ].map((box, idx) => (
                                <div key={idx} className="p-4 md:p-8 rounded-2xl md:rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/5 transition-all hover:bg-white/10 text-left">
                                    <div className="text-amber-500 mb-2 md:mb-4 [&>svg]:w-5 [&>svg]:h-5 md:[&>svg]:w-6 md:[&>svg]:h-6">{box.icon}</div>
                                    <h3 className="text-base md:text-xl font-normal text-white mb-1.5 md:mb-3">{box.title}</h3>
                                    <p className="text-sm text-gray-300 font-light leading-snug md:leading-relaxed">{box.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features list */}
                <section className="text-center py-5 md:py-10" data-aos="fade-up">
                    <h2 className="text-xl md:text-3xl font-normal text-white mb-3 md:mb-6">Expert Vastu Consultancy</h2>
                    <div className="grid md:grid-cols-2 gap-3 md:gap-10 text-left mt-6 md:mt-16">
                        {[
                            { icon: <Compass size={24} />, title: 'Design & Blueprint Audits', desc: 'Detailed review of floor plans for upcoming constructions to ensure a \'Vastu-perfect\' start.' },
                            { icon: <Shield size={24} />, title: 'No-Demolition Remedies', desc: 'Correct structural defects using colors and strategic placements without breaking a single wall.' }
                        ].map((item, idx) => (
                            <div key={idx} className="custom-list-item">
                                <div className="icon-box">{item.icon}</div>
                                <div>
                                    <h4 className="text-base md:text-xl font-normal text-white mb-1 md:mb-2">{item.title}</h4>
                                    <p className="text-sm md:text-base text-gray-300 font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link to="/astrologers" className="inline-block mt-8 md:mt-16 bg-amber-500 text-indigo-950 px-8 py-3 md:px-12 md:py-4 rounded-full font-normal text-base md:text-lg shadow-xl shadow-amber-500/10 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all">
                        Consult a Vastu Expert
                    </Link>
                </section>

                <FAQSection faqs={faqs} />
            </main>
            <Footer />
        </div>
    );
};

export default VastuShastra;
