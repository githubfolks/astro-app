import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// Three.js example imports removed as they are no longer used for redundant 3D text
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const KundliMatching: React.FC = () => {
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

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffd700, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 2000;
        const posArray = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.005,
            color: '#FFD700',
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // Sacred Geometry
        const octaGeo = new THREE.OctahedronGeometry(4, 0);
        const octaMat = new THREE.MeshBasicMaterial({
            color: '#FFB800',
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });
        const octaMesh = new THREE.Mesh(octaGeo, octaMat);
        scene.add(octaMesh);

        // Sacramento Heart (Simplified Wireframe)
        const heartShape = new THREE.Shape();
        heartShape.moveTo(0, 0);
        heartShape.bezierCurveTo(0, -0.3, -0.6, -0.3, -0.6, 0);
        heartShape.bezierCurveTo(-0.6, 0.3, 0, 0.6, 0.6, 1);
        heartShape.bezierCurveTo(1.2, 0.6, 1.8, 0.3, 1.8, 0);
        heartShape.bezierCurveTo(1.8, -0.3, 1.2, -0.3, 1.2, 0);
        heartShape.bezierCurveTo(1.2, 0, 0.6, 0, 0, 0);

        const heartGeo = new THREE.IcosahedronGeometry(2, 2);
        const heartMat = new THREE.MeshBasicMaterial({ color: '#FFD700', wireframe: true, transparent: true, opacity: 0.1 });
        const heartMesh = new THREE.Mesh(heartGeo, heartMat);
        scene.add(heartMesh);

        camera.position.z = 5;

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
            heartMesh.rotation.y += 0.005 + (mouseX * 0.05);
            heartMesh.rotation.x += 0.005 + (mouseY * 0.05);
            particlesMesh.rotation.y += 0.001;
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            camera.aspect = window.innerWidth / 600;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, 600);
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
        <div className="bg-slate-50 text-slate-900 leading-relaxed min-h-screen font-['Outfit']">
            <Header />

            {/* Hero Section */}
            <header className="spiritual-bg text-white py-24 px-6 text-center relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
                <canvas ref={canvasRef} className="absolute inset-0 z-0" />
                <div className="max-w-4xl mx-auto relative z-10 pointer-events-none">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-4 drop-shadow-2xl">Kundli Matching</h1>
                    </div>
                    <p className="text-xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
                        Discover divine compatibility and ensure a harmonious union through the ancient wisdom of Vedic Astrology.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
                {/* What is Kundli Matching */}
                <section className="flex flex-col md:flex-row items-center gap-12" data-aos="fade-up">
                    <div className="md:w-1/2" data-aos="fade-right" data-aos-delay="200">
                        <h2 className="text-3xl font-bold text-indigo-900 mb-6 flex items-center gap-3">
                            <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600 animate-bounce">🕉️</span>
                            What is Kundli Matching?
                        </h2>
                        <div className="space-y-4 text-slate-600 text-lg">
                            <p>
                                Kundli Matching, also known as <span className="font-semibold text-slate-800">Guna Milan</span> or
                                Horoscope Matching, is the time-tested Vedic practice of comparing the celestial blueprints of
                                two individuals before they enter the sacred bond of marriage.
                            </p>
                            <p>
                                At its core, it utilizes the <span className="italic">Ashta-koota</span> system, which evaluates 8
                                different aspects (Kootas) of compatibility, resulting in a total score out of 36 Gunas.
                            </p>
                        </div>
                    </div>
                    <div className="md:w-1/2 bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl"
                        data-aos="fade-left" data-aos-delay="400">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { emoji: '🦁', label: 'Varna', bg: 'bg-amber-50', text: 'text-amber-900' },
                                { emoji: '🌊', label: 'Vashya', bg: 'bg-indigo-50', text: 'text-indigo-900' },
                                { emoji: '🌟', label: 'Tara', bg: 'bg-rose-50', text: 'text-rose-900' },
                                { emoji: '🐉', label: 'Yoni', bg: 'bg-emerald-50', text: 'text-emerald-900' }
                            ].map((item, idx) => (
                                <div key={idx} className={`p-4 ${item.bg} rounded-2xl text-center transition-colors hover:shadow-md`}>
                                    <span className="block text-2xl mb-1">{item.emoji}</span>
                                    <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-center text-xs text-slate-400 uppercase tracking-widest">The 8 Pillars of Compatibility</div>
                    </div>
                </section>

                {/* Why This is Required for a Couple */}
                <section className="bg-indigo-900 rounded-[3rem] p-10 md:p-16 text-white overflow-hidden relative" data-aos="zoom-in">
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-10 text-center" data-aos="fade-down">Why is it Required for a Couple?</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { num: '01', title: 'Health & Longevity', desc: 'Predictions regarding the physical and mental well-being of both partners after marriage.' },
                                { num: '02', title: 'Family & Progeny', desc: 'Assessing the happiness of the household and the potential for healthy offspring.' },
                                { num: '03', title: 'Mental Accord', desc: 'Analyzing temperamental compatibility to prevent future conflicts and foster mutual respect.' }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 transition-all hover:bg-white/10" data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
                                    <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center text-indigo-900 text-xl font-bold mb-4">{item.num}</div>
                                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                                    <p className="text-indigo-100 leading-relaxed font-light">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How Aadikarta Helps */}
                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6" data-aos="fade-down">How Aadikarta Astrologers Help You</h2>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-12" data-aos="fade-up">
                        While digital matching gives you a score, only an expert astrologer can interpret the deeper nuances and provide effective mitigation strategies.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        {[
                            { letter: 'A', title: 'Detailed Dosha Analysis', desc: 'Comprehensive checking for Manglik Dosha, Bhakoot Dosha, and Nadi Dosha.' },
                            { letter: 'B', title: 'Remedial Solutions', desc: 'Personalized remedies including gemstones, mantras, and pujas to neutralize influences.' },
                            { letter: 'C', title: 'Face-to-Face Clarity', desc: 'Direct interaction with verified Vedic experts to discuss specific concerns.' },
                            { letter: 'D', title: 'Holistic Prediction', desc: 'Going beyond simple scores to analyze Navamsha charts and planetary periods.' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-5 p-6 rounded-2xl bg-white shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos={idx % 2 === 0 ? "fade-right" : "fade-left"} data-aos-delay={(idx + 1) * 100}>
                                <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">{item.letter}</div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg mb-1">{item.title}</h4>
                                    <p className="text-slate-500 font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="mt-16 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg shadow-indigo-200 transition-all hover:scale-105" data-aos="zoom-in" data-aos-delay="500">
                        Consult an Expert Now
                    </button>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default KundliMatching;
