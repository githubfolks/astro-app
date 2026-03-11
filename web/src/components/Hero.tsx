import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Hero.css';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // The Sun - Central Light Source
        const sunLight = new THREE.PointLight(0xffddaa, 4, 150);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        // Sun Visuals
        const sunGeo = new THREE.SphereGeometry(2, 32, 32);
        const sunMat = new THREE.MeshStandardMaterial({
            color: '#fff176',
            emissive: '#ff9800',
            emissiveIntensity: 2.5,
            roughness: 0.1
        });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        scene.add(sun);

        // Sun Glow
        const glowGeo = new THREE.SphereGeometry(2.3, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: '#ffb74d',
            transparent: true,
            opacity: 0.2
        });
        const sunGlow = new THREE.Mesh(glowGeo, glowMat);
        scene.add(sunGlow);

        // Deep Space Starfield
        const starGeo = new THREE.BufferGeometry();
        const starCount = 4000;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 120;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ size: 0.02, color: '#ffffff', transparent: true, opacity: 0.8 });
        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);

        // Planet Factory
        const createPlanet = (radius: number, color: string, emissiveColor: string) => {
            const geo = new THREE.SphereGeometry(radius, 32, 32);
            const mat = new THREE.MeshStandardMaterial({
                color,
                emissive: emissiveColor,
                emissiveIntensity: 0.5,
                metalness: 0.3,
                roughness: 0.6
            });
            return new THREE.Mesh(geo, mat);
        };

        const planets: { mesh: THREE.Mesh | THREE.Group, dist: number, speed: number, offset: number }[] = [];

        const addPlanet = (radius: number, color: string, emissive: string, dist: number, speed: number) => {
            const mesh = createPlanet(radius, color, emissive);
            planets.push({ mesh, dist, speed, offset: Math.random() * Math.PI * 2 });
            scene.add(mesh);
            return mesh;
        };

        // Complete Solar System
        addPlanet(0.35, '#94a3b8', '#475569', 6, 1.4);    // Mercury
        addPlanet(0.7, '#fbbf24', '#b45309', 9, 1.1);     // Venus
        addPlanet(0.75, '#3b82f6', '#1e3a8a', 12, 0.9);   // Earth
        addPlanet(0.5, '#ef4444', '#7f1d1d', 15, 0.7);    // Mars
        addPlanet(1.4, '#d4a373', '#78350f', 22, 0.5);   // Jupiter

        // Saturn with Rings
        const saturnGroup = new THREE.Group();
        const saturnBody = createPlanet(1.2, '#e9edc9', '#713f12');
        saturnGroup.add(saturnBody);
        const ringGeo = new THREE.TorusGeometry(2, 0.15, 2, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.5 });
        const rings = new THREE.Mesh(ringGeo, ringMat);
        rings.rotation.x = Math.PI / 2.2;
        saturnGroup.add(rings);
        planets.push({ mesh: saturnGroup, dist: 28, speed: 0.35, offset: Math.random() * Math.PI * 2 });
        scene.add(saturnGroup);

        addPlanet(0.9, '#22d3ee', '#0e7490', 35, 0.25);   // Uranus
        addPlanet(0.85, '#6366f1', '#3730a3', 42, 0.18);  // Neptune

        camera.position.z = 35;
        camera.position.y = 12;
        camera.lookAt(0, 0, 0);

        // Interaction
        let mouseX = 0;
        let mouseY = 0;
        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX / window.innerWidth) - 0.5;
            mouseY = (event.clientY / window.innerHeight) - 0.5;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            requestAnimationFrame(animate);
            const time = Date.now() * 0.0005;

            // Sun Animations
            sun.rotation.y += 0.002;
            sunGlow.scale.setScalar(1 + Math.sin(time * 2) * 0.05);

            // Orbit Animations
            planets.forEach(p => {
                p.mesh.position.x = Math.sin(time * p.speed + p.offset) * p.dist;
                p.mesh.position.z = Math.cos(time * p.speed + p.offset) * p.dist;
                if (p.mesh instanceof THREE.Mesh) p.mesh.rotation.y += 0.01;
                else p.mesh.children[0].rotation.y += 0.01;
            });

            // Parallax
            camera.position.x += (mouseX * 15 - camera.position.x) * 0.05;
            camera.position.y += (-mouseY * 12 + 12 - camera.position.y) * 0.05;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            scene.clear();
        };
    }, []);

    return (
        <section className="hero-section spiritual-bg overflow-hidden relative min-h-screen lg:min-h-[800px] flex items-center">
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

            <div className="container hero-content relative z-10 py-12">
                <div className="hero-text">
                    <span className="hero-badge bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-indigo-200 text-sm font-semibold border border-white/20">✨ India's #1 Astrology Platform</span>
                    <h1 className="hero-title mt-6">
                        Unlock Your
                        <span className="gradient-text block mt-2"> Cosmic Destiny</span>
                    </h1>
                    <p className="hero-description text-indigo-100 text-xl mt-6 opacity-90 leading-relaxed">
                        Connect with expert astrologers, get accurate horoscopes, and find guidance for your life's journey. Your future awaits.
                    </p>
                    <div className="hero-actions mt-10 flex flex-wrap gap-4">
                        <Link to="/chat-with-astrologers" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 shadow-xl shadow-indigo-900/20">Chat with Astrologer</Link>
                        <Link to="/blog" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105">Daily Horoscope</Link>
                    </div>

                    <div className="hero-stats mt-16 grid grid-cols-3 gap-8">
                        <div className="stat-item">
                            <span className="stat-value text-3xl font-bold text-white block">500+</span>
                            <span className="stat-label text-indigo-200 text-sm opacity-80 uppercase tracking-wider">Verified Experts</span>
                        </div>
                        <div className="stat-item border-l border-white/10 pl-8">
                            <span className="stat-value text-3xl font-bold text-white block">1M+</span>
                            <span className="stat-label text-indigo-200 text-sm opacity-80 uppercase tracking-wider">Happy Users</span>
                        </div>
                        <div className="stat-item border-l border-white/10 pl-8">
                            <span className="stat-value text-3xl font-bold text-white block">24/7</span>
                            <span className="stat-label text-indigo-200 text-sm opacity-80 uppercase tracking-wider">Live Support</span>
                        </div>
                    </div>
                </div>

                <div className="hero-image-container relative">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                    <img
                        src="/assets/hero_astrology.png"
                        alt="Indian Mythological Astrology"
                        className="hero-image relative z-10 rounded-[3rem] shadow-2xl border-4 border-white/10"
                        fetchPriority="high"
                        loading="eager"
                        width="800"
                        height="600"
                    />
                    <div className="floating-card absolute -right-6 top-1/4 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl z-20 flex items-center gap-4 animate-bounce-slow">
                        <span className="text-3xl">🌟</span>
                        <div className="text text-black">
                            <strong className="block text-sm">Daily Insights</strong>
                            <span className="text-xs opacity-70 italic">Updated now</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
