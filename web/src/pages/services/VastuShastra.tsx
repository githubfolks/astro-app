import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// Three.js example imports removed as they are no longer used for redundant 3D text
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const VastuShastra: React.FC = () => {
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

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0x10b981, 1.5);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // Holographic Blueprint Grid
        const gridGroup = new THREE.Group();
        const gridHelper = new THREE.GridHelper(30, 30, '#059669', '#064e3b');
        gridHelper.position.y = -3;
        gridHelper.rotation.x = Math.PI / 8;
        gridGroup.add(gridHelper);

        const lineMat = new THREE.LineBasicMaterial({ color: '#10b981', transparent: true, opacity: 0.1 });
        for (let i = 0; i < 10; i++) {
            const points = [];
            points.push(new THREE.Vector3(-15, -3 + (i * 0.5), -15));
            points.push(new THREE.Vector3(15, -3 + (i * 0.5), -15));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMat);
            line.position.z = -15 + (i * 3.5);
            gridGroup.add(line);
        }
        scene.add(gridGroup);

        camera.position.z = 6;
        camera.position.y = 1;

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
            gridGroup.rotation.y += 0.001 + (mouseX * 0.01);
            gridGroup.rotation.x = (mouseY * 0.05);
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
        <div className="bg-emerald-50/30 text-slate-900 leading-relaxed min-h-screen font-['Outfit']">
            <Header />
            {/* Hero Section */}
            <header className="vastu-bg text-white py-24 px-6 text-center relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
                <canvas ref={canvasRef} className="absolute inset-0 z-0" />
                <div className="max-w-4xl mx-auto relative z-10 pointer-events-none">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-5xl md:text-7xl font-bold gradient-text-emerald mb-4 drop-shadow-2xl">Vastu Shastra</h1>
                    </div>
                    <p className="text-xl text-emerald-100 font-light max-w-2xl mx-auto mt-8">
                        Transform your living and working spaces into vessels of prosperity and peace.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
                <section className="flex flex-col lg:flex-row items-center gap-16" data-aos="fade-up">
                    <div className="lg:w-1/2" data-aos="fade-right">
                        <div className="inline-block px-4 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mb-6">
                            Ancient Science. Modern Spaces.
                        </div>
                        <h2 className="text-4xl font-bold text-emerald-900 mb-8 leading-tight">
                            The Sacred Geometry of <span className="bg-gradient-to-r from-[#10b981] to-[#059669] bg-clip-text text-transparent italic">Your Home</span>
                        </h2>
                        <div className="space-y-6 text-slate-600 text-lg">
                            <p>
                                Vastu Shastra is the metaphysical blueprint of living. By aligning your architecture with natural rhythms, we synchronize your space with the Earth.
                            </p>
                            <p>
                                Every compass point is a gateway to a specific planetary influence and one of the five elements. Balanced energies convert your home into a battery for success.
                            </p>
                        </div>
                    </div>
                    <div className="lg:w-1/2" data-aos="fade-left">
                        <div className="grid grid-cols-3 gap-4 max-w-[400px] mx-auto">
                            {[
                                { dir: 'NW', el: 'Air', bg: 'bg-[#e0f2fe]', text: 'text-[#075985]' },
                                { dir: 'North', el: 'Water', bg: 'bg-[#dcfce7]', text: 'text-[#166534]' },
                                { dir: 'NE', el: 'Water', bg: 'bg-[#dcfce7]', text: 'text-[#166534]' },
                                { dir: 'West', el: 'Air', bg: 'bg-[#e0f2fe]', text: 'text-[#075985]' },
                                { dir: '☸️', el: 'Space', bg: 'bg-[#f3e8ff]', text: 'text-[#6b21a8]', center: true },
                                { dir: 'East', el: 'Fire', bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]' },
                                { dir: 'SW', el: 'Earth', bg: 'bg-[#fef3c7]', text: 'text-[#92400e]' },
                                { dir: 'South', el: 'Fire', bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]' },
                                { dir: 'SE', el: 'Fire', bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]' }
                            ].map((card, idx) => (
                                <div key={idx} className={`aspect-square flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-[#d1fae5] transition-all hover:bg-[#ecfdf5] hover:border-[#10b981] hover:-translate-y-1 shadow-sm ${card.center ? 'border-none bg-[#f0fdf4] scale-110 shadow-inner' : ''}`}>
                                    <span className={`font-bold text-xs uppercase ${card.center ? 'text-2xl' : ''}`}>{card.dir}</span>
                                    <span className={`text-[10px] uppercase font-bold mt-1 px-2 py-0.5 rounded-full ${card.bg} ${card.text}`}>{card.el}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-12 bg-white rounded-[3rem] p-12 shadow-xl shadow-emerald-100/20 border border-emerald-50" data-aos="zoom-in">
                    <h2 className="text-3xl font-bold text-center text-slate-800 mb-16">The Five Elements — <span className="italic text-emerald-600">Pancha Bhoota</span></h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        {[
                            { emoji: '💧', name: 'Water', sanskrit: 'Jala', color: 'blue' },
                            { emoji: '🔥', name: 'Fire', sanskrit: 'Agni', color: 'red' },
                            { emoji: '🌱', name: 'Earth', sanskrit: 'Prithvi', color: 'amber' },
                            { emoji: '💨', name: 'Air', sanskrit: 'Vayu', color: 'sky' },
                            { emoji: '🌌', name: 'Space', sanskrit: 'Akasha', color: 'purple' }
                        ].map((element, idx) => (
                            <div key={idx} className="flex flex-col items-center group transition-all" data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
                                <div className={`w-20 h-20 rounded-3xl bg-${element.color}-50 flex items-center justify-center text-3xl group-hover:bg-${element.color}-500 group-hover:text-white transition-all cursor-help shadow-sm overflow-hidden relative`}>
                                    <span className="z-10">{element.emoji}</span>
                                    <div className={`absolute bottom-0 left-0 w-full h-0 bg-${element.color}-400 group-hover:h-full transition-all duration-500 opacity-20`}></div>
                                </div>
                                <span className="mt-4 font-bold text-slate-700">{element.name}</span>
                                <span className={`text-[10px] uppercase tracking-widest text-${element.color}-400 font-bold`}>{element.sanskrit}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-emerald-900 rounded-[3rem] p-10 md:p-16 text-white overflow-hidden relative" data-aos="zoom-in">
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-[100px]"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-4xl font-bold mb-12">The Geometry of Success</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { emoji: '🚪', title: 'Entrance Power', desc: 'The main entry is the "mouth" of your home. We ensure it\'s positioned for prosperity.' },
                                { emoji: '⚖️', title: 'Energy Balancing', desc: 'Harmonize zones for sleep, work, and nourishment to remove stagnant blocks.' },
                                { emoji: '💰', title: 'Wealth Zones', desc: 'Optimize the North and NE corners to amplify financial stability and growth.' }
                            ].map((box, idx) => (
                                <div key={idx} className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10 text-left" data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
                                    <div className="text-3xl mb-4">{box.emoji}</div>
                                    <h3 className="text-xl font-bold mb-3 text-emerald-300">{box.title}</h3>
                                    <p className="text-emerald-100/80 font-light leading-relaxed">{box.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-6">Expert Vastu Consultancy</h2>
                    <div className="grid md:grid-cols-2 gap-10 text-left mt-16">
                        <div className="p-10 rounded-[2.5rem] bg-white border border-emerald-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-right">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl mb-6">🏗️</div>
                            <h4 className="text-2xl font-bold text-emerald-900 mb-4">Design & Blueprint Audits</h4>
                            <p className="text-slate-600 text-lg leading-relaxed">Detailed review of floor plans for upcoming constructions to ensure a 'Vastu-perfect' start.</p>
                        </div>
                        <div className="p-10 rounded-[2.5rem] bg-white border border-emerald-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-left">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl mb-6">🔨</div>
                            <h4 className="text-2xl font-bold text-emerald-900 mb-4">No-Demolition Remedies</h4>
                            <p className="text-slate-600 text-lg leading-relaxed">Correct structural defects using colors and strategic placements without breaking a single wall.</p>
                        </div>
                    </div>
                    <button className="mt-20 bg-emerald-700 hover:bg-emerald-800 text-white px-16 py-5 rounded-full font-bold text-xl shadow-2xl shadow-emerald-200 transition-all hover:scale-110 active:scale-95" data-aos="zoom-in">
                        Consult a Vastu Expert
                    </button>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default VastuShastra;
