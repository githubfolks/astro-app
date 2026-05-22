import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// Three.js example imports removed as they are no longer used for redundant 3D text
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

const tarotStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/tarot-reading#service',
            name: 'Online Tarot Card Reading',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Accurate online tarot card readings from expert tarot readers. Past, present, and future readings covering love, career, finances, and life guidance. Live chat sessions from ₹10/min.',
            areaServed: 'IN',
            offers: { '@type': 'Offer', priceCurrency: 'INR', price: '10', priceSpecification: { '@type': 'UnitPriceSpecification', price: '10', priceCurrency: 'INR', unitText: 'per minute' } },
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'How accurate is tarot card reading?', acceptedAnswer: { '@type': 'Answer', text: 'Tarot accuracy depends on the reader\'s intuition, experience, and the clarity of the question asked. Skilled readers use the cards as a tool for insight and reflection, not literal prediction.' } },
                { '@type': 'Question', name: 'What questions can I ask in a tarot reading?', acceptedAnswer: { '@type': 'Answer', text: 'You can ask about love, relationships, career, finances, health, decisions, and personal growth. Open-ended questions like "What do I need to know about X?" tend to yield the most insightful readings.' } },
                { '@type': 'Question', name: 'Is online tarot reading as accurate as in-person?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, online tarot readings can be just as accurate as in-person sessions. The energy and intention of the question, not physical proximity, are what matter to experienced tarot readers.' } },
                { '@type': 'Question', name: 'How much does a tarot reading cost on Aadikarta?', acceptedAnswer: { '@type': 'Answer', text: 'Tarot readings on Aadikarta start from ₹10 per minute. A standard 3-card reading session takes about 10–15 minutes; a full Celtic Cross spread typically runs 30–45 minutes.' } },
            ],
        },
    ],
};

const TarotReading: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: false,
            mirror: true
        });
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 600, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, 600);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xa855f7, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        const cardGeo = new THREE.PlaneGeometry(1, 1.6);
        const cardMat = new THREE.MeshBasicMaterial({ color: '#a855f7', wireframe: true, transparent: true, opacity: 0.1 });
        const cards = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const card = new THREE.Mesh(cardGeo, cardMat);
            card.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
            cards.add(card);
        }
        scene.add(cards);

        camera.position.z = 6;

        // Interaction
        let mouseX = 0;
        let mouseY = 0;
        const onMouseMove = (e: MouseEvent) => {
            mouseX = (e.clientX / window.innerWidth) - 0.5;
            mouseY = (e.clientY / window.innerHeight) - 0.5;
        };
        window.addEventListener('mousemove', onMouseMove);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            cards.rotation.y += 0.002 + (mouseX * 0.05);
            cards.rotation.x += (mouseY * 0.05);
            cards.children.forEach(c => { c.rotation.x += 0.002; c.rotation.y += 0.003; });
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            camera.aspect = window.innerWidth / 600;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, 600);
            // The following lines are removed as per the instruction to remove redundant 3D text
            // if (textMesh) {
            //     const newSize = window.innerWidth < 768 ? 0.4 : 0.6;
            //     const font = (textMesh.geometry as any).parameters.font as Font;
            //     const newGeo = new TextGeometry('Tarot Reading', {
            //         font: font,
            //         size: newSize,
            //         height: 0.04,
            //         curveSegments: 12,
            //         bevelEnabled: true,
            //         bevelThickness: 0.01,
            //         bevelSize: 0.02
            //     });
            //     newGeo.center();
            //     textMesh.geometry.dispose();
            //     textMesh.geometry = newGeo;
            // }
        };
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            scene.clear();
        };
    }, []);

    return (
        <div className="bg-purple-50/30 text-slate-900 leading-relaxed min-h-screen font-['Open Sans']">
            <SEO
                title="Online Tarot Reading | Accurate Tarot Card Consultations"
                description="Get accurate online tarot card readings from expert readers on Aadikarta. Past, present, and future readings for love, career, and life guidance. Live sessions from ₹10/min."
                structuredData={tarotStructuredData}
            />
            <Header />
            {/* Hero Section */}
            <header className="celestial-bg text-white py-24 px-6 text-center relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
                <canvas ref={canvasRef} className="absolute inset-0 z-0" />
                <div className="max-w-4xl mx-auto relative z-10 pointer-events-none">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-5xl md:text-5xl mb-4 drop-shadow-2xl">Tarot Reading</h1>
                    </div>
                    <p className="text-xl text-purple-100 font-light max-w-2xl mx-auto mt-8">
                        Unlock the subconscious through the symbolic language of the divine deck.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
                <section className="flex flex-col md:flex-row items-center gap-12" data-aos="fade-up">
                    <div className="md:w-1/2" data-aos="fade-right">
                        <h2 className="text-3xl font-bold text-indigo-900 mb-6 flex items-center gap-3">
                            <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600 animate-pulse">🃏</span>
                            What is Tarot Reading?
                        </h2>
                        <div className="space-y-4 text-slate-600 text-lg">
                            <p>
                                Tarot is a symbolic language spoken through a deck of 78 cards, used to mirror your subconscious mind and reveal hidden truths.
                            </p>
                            <p>
                                Whether you seek answers about love or career, the Major and Minor Arcana act as celestial archetypes that guide you toward clarity.
                            </p>
                        </div>
                    </div>
                    <div className="md:w-1/2 bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl" data-aos="fade-left">
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-indigo-50 flex items-center justify-center gap-4">
                            <div className="w-16 h-24 bg-indigo-200 rounded-lg animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-16 h-24 bg-indigo-600 rounded-lg animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-16 h-24 bg-indigo-200 rounded-lg animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                    </div>
                </section>

                <section className="bg-indigo-900 rounded-[3rem] p-10 md:p-16 text-white overflow-hidden relative" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-bold mb-10" data-aos="fade-down">The Path to Mystical Clarity</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            {[
                                { emoji: '👁️', title: 'Intuitive Insights', desc: 'Go beyond the surface to understand underlying motivations and unseen obstacles.' },
                                { emoji: '🔮', title: 'Future Pathways', desc: 'Map out potential outcomes based on your current energy and decisions.' },
                                { emoji: '🧘', title: 'Spiritual Growth', desc: 'Identify karmic lessons and spiritual milestones on your soul\'s journey.' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10" data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
                                    <div className="text-purple-300 text-3xl mb-4">{item.emoji}</div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-indigo-100 font-light leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Expert Tarot Interpretations</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                        <div className="p-8 rounded-2xl bg-white border border-indigo-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-right">
                            <h4 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-3">🎴 Celtic Cross Spreads</h4>
                            <p className="text-slate-600 font-light">Comprehensive 10-card analysis for deep life questions and situational audits.</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white border border-indigo-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-left">
                            <h4 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-3">🕯️ One-on-One Sessions</h4>
                            <p className="text-slate-600 font-light">Direct interaction with intuitive readers to explore specific concerns in real-time.</p>
                        </div>
                    </div>
                    <button className="mt-16 bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-200 transition-all hover:scale-110 active:scale-95" data-aos="zoom-in">
                        Start Your Reading
                    </button>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default TarotReading;
