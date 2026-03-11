import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// Three.js example imports removed as they are no longer used for redundant 3D text
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const LoveAdvice: React.FC = () => {
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
        const pointLight = new THREE.PointLight(0xfb7185, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1000;
        const posArray = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 10;
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({ size: 0.008, color: '#fb7185', transparent: true, opacity: 0.6 });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        const heartGroup = new THREE.Group();
        const heartShape = new THREE.Shape();
        heartShape.moveTo(0, 0);
        heartShape.bezierCurveTo(0, -0.3, -0.6, -0.3, -0.6, 0);
        heartShape.bezierCurveTo(-0.6, 0.3, 0, 0.6, 0.6, 1);
        heartShape.bezierCurveTo(1.2, 0.6, 1.8, 0.3, 1.8, 0);
        heartShape.bezierCurveTo(1.8, -0.3, 1.2, -0.3, 1.2, 0);
        heartShape.bezierCurveTo(1.2, 0, 0.6, 0, 0, 0);

        const heartGeo = new THREE.ShapeGeometry(heartShape);
        const heartMat = new THREE.MeshBasicMaterial({ color: '#fb7185', transparent: true, opacity: 0.1 });

        for (let i = 0; i < 50; i++) {
            const heart = new THREE.Mesh(heartGeo, heartMat);
            heart.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
            heart.rotation.z = Math.PI;
            heart.rotation.x = Math.random() * Math.PI;
            heart.scale.set(0.15, 0.15, 0.15);
            heartGroup.add(heart);
        }
        scene.add(heartGroup);

        camera.position.z = 5; // Interaction
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
            particlesMesh.rotation.y += 0.001; // Keep particles animated
            heartGroup.rotation.y += 0.002 + (mouseX * 0.02);
            heartGroup.rotation.x += (mouseY * 0.01); // Use mouseY for X-axis rotation
            heartGroup.children.forEach((heart, i) => {
                heart.position.y += Math.sin(Date.now() * 0.001 + i) * 0.005;
            });
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
    }, []); // End of useEffect

    return (
        <div className="bg-rose-50/30 text-slate-900 leading-relaxed min-h-screen font-['Open Sans']">
            <Header />
            {/* Hero Section */}
            <header className="spiritual-bg text-white py-24 px-6 text-center relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
                <canvas ref={canvasRef} className="absolute inset-0 z-0" />
                <div className="max-w-4xl mx-auto relative z-10 pointer-events-none">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-5xl md:text-5xl mb-4 drop-shadow-2xl">Love & Relationships</h1>
                    </div>
                    <p className="text-xl text-rose-100 font-light max-w-2xl mx-auto mt-8">
                        Navigate the complexities of the heart with celestial insight and compassionate guidance.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
                <section className="flex flex-col md:flex-row items-center gap-12" data-aos="fade-up">
                    <div className="md:w-1/2" data-aos="fade-right">
                        <h2 className="text-3xl font-bold text-rose-900 mb-6 flex items-center gap-3">
                            <span className="bg-rose-100 p-2 rounded-lg text-rose-600 animate-pulse">❤️</span>
                            What is Love Advice?
                        </h2>
                        <div className="space-y-4 text-slate-600 text-lg">
                            <p>
                                Love advice in astrology is the sacred practice of analyzing the <span className="font-semibold text-rose-700">7th House</span>, Venus, and Mars positions to understand your soul's romantic path.
                            </p>
                            <p>
                                Whether you are navigating a new romance or seeking to deepen a commitment, celestial guidance provides clarity that logic often cannot reach.
                            </p>
                        </div>
                    </div>
                    <div className="md:w-1/2 bg-white p-6 rounded-3xl shadow-xl shadow-rose-100/50 border border-rose-50 transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl" data-aos="fade-left">
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-rose-50 flex items-center justify-center">
                            <span className="text-6xl animate-bounce">💖</span>
                            <div className="absolute inset-0 bg-gradient-to-t from-rose-900/20 to-transparent"></div>
                        </div>
                    </div>
                </section>

                <section className="bg-rose-900 rounded-[3rem] p-10 md:p-16 text-white overflow-hidden relative" data-aos="zoom-in">
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-bold mb-10" data-aos="fade-down">The Benefits of Relationship Guidance</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { emoji: '✨', title: 'Syncing Energies', desc: 'Align your personal vibrations with your partner for deeper emotional resonance.' },
                                { emoji: '🕊️', title: 'Conflict Resolution', desc: 'Understand root causes of friction through planetary aspect analysis.' },
                                { emoji: '⏳', title: 'Divine Timing', desc: 'Identify perfect moments for life-changing romantic decisions and commitments.' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 transition-all hover:bg-white/20" data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
                                    <div className="text-rose-300 text-3xl mb-4">{item.emoji}</div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-rose-100 font-light leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Aadikarta: Compassion Meets Wisdom</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                        <div className="p-8 rounded-2xl bg-white border border-rose-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-right">
                            <h4 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Synastry Reports
                            </h4>
                            <p className="text-slate-600 font-light">Deep-dive comparison of two birth charts to map out emotional, intellectual, and physical compatibility zones.</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white border border-rose-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-left">
                            <h4 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Venus Positioning
                            </h4>
                            <p className="text-slate-600 font-light">Understanding your love language and how to effectively communicate your needs to your significant other.</p>
                        </div>
                    </div>
                    <button className="mt-16 bg-rose-600 hover:bg-rose-700 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-rose-200 transition-all hover:scale-110 active:scale-95" data-aos="zoom-in">
                        Connect with Love Expert
                    </button>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default LoveAdvice;
