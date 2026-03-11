import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// Three.js example imports removed as they are no longer used for redundant 3D text
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const DailyHoroscope: React.FC = () => {
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

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        // Zodiac Ring (Rotating wireframe)
        const zodiacRingGeo = new THREE.TorusGeometry(3.5, 0.02, 16, 100);
        const zodiacRingMat = new THREE.MeshBasicMaterial({ color: '#60a5fa', wireframe: true, transparent: true, opacity: 0.1 });
        const zodiacRingMesh = new THREE.Mesh(zodiacRingGeo, zodiacRingMat);
        scene.add(zodiacRingMesh);

        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 15;
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ size: 0.005, color: '#ffffff', transparent: true, opacity: 0.8 });
        const particlesMesh = new THREE.Points(starGeo, starMat);
        scene.add(particlesMesh);

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
            zodiacRingMesh.rotation.y += 0.002 + (mouseX * 0.05);
            zodiacRingMesh.rotation.x = (mouseY * 0.2);
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
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', onMouseMove);
            renderer.dispose();
            scene.clear();
        };
    }, []);

    return (
        <div className="bg-blue-50/30 text-slate-900 leading-relaxed min-h-screen font-['Outfit']">
            <Header />
            {/* Hero Section */}
            <header className="celestial-bg text-white py-24 px-6 text-center relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
                <canvas ref={canvasRef} className="absolute inset-0 z-0" />
                <div className="max-w-4xl mx-auto relative z-10 pointer-events-none">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-4 drop-shadow-2xl">Daily Horoscope</h1>
                    </div>
                    <p className="text-xl text-blue-100 font-light max-w-2xl mx-auto mt-8">
                        Align your actions with the cosmic rhythm every single day.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
                <section className="flex flex-col md:flex-row items-center gap-12" data-aos="fade-up">
                    <div className="md:w-1/2" data-aos="fade-right">
                        <h2 className="text-3xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                            <span className="bg-blue-100 p-2 rounded-lg text-blue-600 animate-bounce">🌞</span>
                            What is a Daily Horoscope?
                        </h2>
                        <div className="space-y-4 text-slate-600 text-lg">
                            <p>
                                A daily horoscope is a snapshot of the celestial landscape, mapping the <span className="font-semibold text-blue-700">transits of planets</span> against your zodiac sign.
                            </p>
                            <p>
                                By understanding the Moon's transit and planetary alignments, you can better navigate emotional tides and choose the most auspicious moments for action.
                            </p>
                        </div>
                    </div>
                    <div className="md:w-1/2 bg-white p-6 rounded-3xl shadow-xl shadow-blue-100/50 border border-blue-50 transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl" data-aos="fade-left">
                        <div className="grid grid-cols-3 gap-3">
                            {['♈', '♉', '♊', '♋', '♌', '♍'].map((sign, idx) => (
                                <div key={idx} className="aspect-square bg-blue-50 rounded-xl flex items-center justify-center text-2xl hover:bg-blue-100 transition-colors cursor-pointer hover:shadow-md">
                                    {sign}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-blue-900 rounded-[3rem] p-10 md:p-16 text-white overflow-hidden relative" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-bold mb-10" data-aos="fade-down">Why Read Your Horoscope Daily?</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            {[
                                { emoji: '🎯', title: 'Clarity of Mind', desc: 'Start your day with an intentional focus, grounded in cosmic awareness.' },
                                { emoji: '🛡️', title: 'Preparedness', desc: 'Identify potential pitfalls before they arise and navigate them with grace.' },
                                { emoji: '🌈', title: 'Opportunity', desc: 'Spot hidden lucky patches in your timeline for major moves.' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 transition-all hover:bg-white/20" data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
                                    <div className="text-blue-300 text-3xl mb-4">{item.emoji}</div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-blue-100 font-light leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Expert Guidance at Your Fingertips</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                        {[
                            { num: 1, title: 'Personalized Transits', desc: 'Go beyond general sun-sign astrology to see how planets move through your specific chart.' },
                            { num: 2, title: 'Remedial Tips', desc: 'Simple color, habit, and mantra recommendations to optimize your daily outcome.' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex gap-6 p-8 rounded-2xl bg-white border border-blue-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos={idx % 2 === 0 ? "fade-right" : "fade-left"}>
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">{item.num}</div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h4>
                                    <p className="text-slate-600 font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-16 bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-200 transition-all hover:scale-110 active:scale-95" data-aos="zoom-in">
                        Get Your Full Reading
                    </button>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default DailyHoroscope;
