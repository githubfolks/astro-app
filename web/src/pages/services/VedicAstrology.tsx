import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// Three.js example imports removed as they are no longer used for redundant 3D text
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const VedicAstrology: React.FC = () => {
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

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xf59e0b, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
        const cubeMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', wireframe: true, transparent: true, opacity: 0.15 });
        const cube = new THREE.Mesh(cubeGeo, cubeMat);
        scene.add(cube);

        const pGeo = new THREE.BufferGeometry();
        const pCount = 1000;
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 10;
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ size: 0.006, color: '#f59e0b', transparent: true, opacity: 0.5 });
        const particlesMesh = new THREE.Points(pGeo, pMat); // Renamed particles to particlesMesh as per snippet
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
            cube.rotation.y += 0.002 + (mouseX * 0.01);
            cube.rotation.x += 0.001 + (mouseY * 0.01);
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
        <div className="bg-amber-50/30 text-slate-900 leading-relaxed min-h-screen font-['Outfit']">
            <Header />
            {/* Hero Section */}
            <header className="spiritual-bg text-white py-24 px-6 text-center relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
                <canvas ref={canvasRef} className="absolute inset-0 z-0" />
                <div className="max-w-4xl mx-auto relative z-10 pointer-events-none">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-4 drop-shadow-2xl">Vedic Astrology</h1>
                    </div>
                    <p className="text-xl text-amber-100 font-light max-w-2xl mx-auto mt-8">
                        The science of light that illuminates your soul's journey through time.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
                <section className="flex flex-col md:flex-row items-center gap-12" data-aos="fade-up">
                    <div className="md:w-1/2" data-aos="fade-right">
                        <h2 className="text-3xl font-bold text-amber-900 mb-6 flex items-center gap-3">
                            <span className="bg-amber-100 p-2 rounded-lg text-amber-600">☸️</span>
                            What is Vedic Astrology?
                        </h2>
                        <div className="space-y-4 text-slate-600 text-lg">
                            <p>
                                Vedic Astrology, or <span className="font-semibold text-amber-800">Jyotish</span> (the science of light), is the world's most ancient system of understanding human destiny.
                            </p>
                            <p>
                                Unlike Western systems, it uses the sidereal zodiac and Nakshatras (lunar mansions) to provide surgical precision in timing life milestones.
                            </p>
                        </div>
                    </div>
                    <div className="md:w-1/2 bg-white p-6 rounded-3xl shadow-xl shadow-amber-100/50 border border-amber-50 transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl" data-aos="fade-left">
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-amber-50 flex items-center justify-center p-8">
                            <div className="grid grid-cols-4 gap-2 w-full text-center text-xs font-bold text-amber-800">
                                {['ASC', 'SUN', 'MOO', 'MER', 'VEN', 'MAR', 'JUP', 'SAT'].map((planet, idx) => (
                                    <div key={idx} className={`p-2 border border-amber-200 ${planet === 'SUN' ? 'bg-amber-100' : ''}`}>{planet}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-amber-900 rounded-[3rem] p-10 md:p-16 text-white overflow-hidden relative" data-aos="zoom-in">
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-bold mb-10" data-aos="fade-down">The Pillars of Jyotish Wisdom</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { title: 'Dasha Systems', desc: 'Unique planetary time periods that reveal exactly WHEN events will manifest.' },
                                { title: 'Varga Charts', desc: 'Divisional charts that act like a microscope, showing specific details about life.' },
                                { title: 'Planetary Yogas', desc: 'Combinations that reveal your inherent potential for wealth and growth.' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10" data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-amber-100 font-light leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Expert Vedic Interpretation</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                        <div className="p-8 rounded-2xl bg-white border border-amber-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-right">
                            <h4 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-3">📜 Birth Chart Analysis</h4>
                            <p className="text-slate-600 font-light italic">"Know yourself through the mirror of the stars."</p>
                            <p className="mt-4 text-slate-500">A comprehensive reading of your Kundli to identify life's purpose and karma.</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white border border-amber-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-left">
                            <h4 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-3">💎 Vedic Remedies</h4>
                            <p className="text-slate-600 font-light italic">"Mitigate challenges, amplify strengths."</p>
                            <p className="mt-4 text-slate-500">Personalized suggestions for gemstones and mantras to balance planetary energy.</p>
                        </div>
                    </div>
                    <button className="mt-16 bg-amber-700 hover:bg-amber-800 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-amber-200 transition-all hover:scale-110 active:scale-95" data-aos="zoom-in">
                        Book a Reading Now
                    </button>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default VedicAstrology;
