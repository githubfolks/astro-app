import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MemoryGuruAbout: React.FC = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: false,
            mirror: true,
            offset: 100
        });
        AOS.refresh();
    }, []);

    return (
        <div className="min-h-screen bg-indigo-50/30 flex flex-col relative overflow-hidden">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-20 max-w-5xl">
                <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-[3rem] p-10 md:p-20 border border-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

                    <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-6 block" data-aos="fade-down">
                        Biography & Profile
                    </span>
                    <h1 className="text-4xl md:text-5xl text-gray-900 mb-10 leading-tight">
                        Rajesh Chaudhary – <span className="gradient-text">Memory Guru</span>
                    </h1>

                    <div className="space-y-16">
                        {/* Intro Section with Image */}
                        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                            <div className="w-full md:w-1/3 flex-shrink-0" data-aos="fade-right">
                                <div className="relative group">
                                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                    <img
                                        src="/assets/memory_guru/rajesh-1.jpeg"
                                        alt="Rajesh Chaudhary - Memory Guru"
                                        className="relative rounded-[2.5rem] shadow-2xl w-full border-8 border-white object-cover aspect-[4/5] transform transition-transform duration-500 hover:scale-[1.02]"
                                    />
                                    <div className="absolute -bottom-4 -right-4 bg-indigo-600 text-white p-4 rounded-2xl shadow-xl">
                                        <p className="text-xs font-bold uppercase tracking-widest text-center">India Book<br />of Records</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-grow space-y-8 text-gray-600 text-xl leading-relaxed">
                                <p>
                                    <strong className="text-gray-900">Rajesh Chaudhary</strong>, popularly known as <strong className="text-indigo-600">Memory Guru</strong>, is one of India's recognized memory trainers and motivational educators, known for transforming the way students and professionals learn, retain, and perform.
                                </p>
                                <p>
                                    With a mission to unlock hidden mental potential, he has dedicated his work to teaching scientific memory systems, concentration enhancement, and accelerated learning techniques that help learners achieve extraordinary academic and personal growth.
                                </p>
                                <p>
                                    Publicly introduced as an <strong className="text-gray-900">India Book of Records holder</strong>, he has conducted large-scale memory development programs where participants experience live demonstrations of advanced recall methods, memory coding systems, and concentration techniques designed for immediate real-life application.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/book"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                            >
                                Courses <ArrowRight size={20} />
                            </Link>
                            <Link
                                to="#"
                                className="bg-white hover:bg-gray-50 text-indigo-900 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Play size={20} className="text-indigo-600" /> Watch Live Demo
                            </Link>
                        </div>
                        {/* Public Identity Section */}
                        <div className="pt-10 border-t border-gray-100" data-aos="fade-up">
                            <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Identity</span>
                            <h2 className="text-3xl md:text-4xl text-gray-900 mb-8">Public Identity & <span className="gradient-text">Recognition</span></h2>
                            <p className="mb-8 text-xl text-gray-600 leading-relaxed">
                                Rajesh Chaudhary has built his identity as a high-impact educational speaker whose sessions combine:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    'Brain science', 'Memory psychology', 'Motivational coaching',
                                    'Practical learning systems', 'Confidence development'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                        <span className="text-gray-800 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-8 text-lg italic text-indigo-600/80">
                                "His seminars are known for producing instant audience engagement because learners can directly experience memory improvement during the session itself."
                            </p>
                        </div>

                        {/* Professional Overview Section */}
                        <div className="pt-10 border-t border-gray-100" data-aos="fade-up">
                            <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Specialization</span>
                            <h2 className="text-3xl md:text-4xl text-gray-900 mb-8">Professional <span className="gradient-text">Overview</span></h2>
                            <p className="mb-8 text-xl text-gray-600 leading-relaxed">
                                Rajesh Chaudhary specializes in helping learners unlock higher brain performance through:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    'Mnemonic coding techniques', 'Visual memory systems', 'Rapid recall methods',
                                    'Number memory methods', 'Formula retention systems', 'Long-answer memorizaton',
                                    'Concentration exercises', 'Exam confidence training'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-colors">
                                        <span className="text-indigo-600 font-bold">✓</span>
                                        <span className="text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Why Memory Guru Section */}
                        <div className="pt-10 border-t border-gray-100" data-aos="fade-up">
                            <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Unique Approach</span>
                            <h2 className="text-3xl md:text-4xl text-gray-900 mb-8">Why He Is Called <span className="gradient-text">"Memory Guru"</span></h2>
                            <p className="mb-8 text-xl text-gray-600 leading-relaxed">
                                His programs focus on turning difficult learning into effortless retention through science-backed systems.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider">Retention Systems</h4>
                                    <ul className="space-y-3">
                                        {['Number techniques', 'Name-face association', 'Long-answer systems', 'Formula methods', 'Presentation recall'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-gray-600">
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider">Target Audience</h4>
                                    <ul className="space-y-3">
                                        {['Board examinations', 'Competitive exams', 'Professional certifications', 'Academic interviews'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-gray-600">
                                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Videos Section */}
                        <div className="pt-10 border-t border-gray-100" data-aos="fade-up">
                            <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Watch in Action</span>
                            <h2 className="text-3xl md:text-4xl text-gray-900 mb-10">Workshop & <span className="gradient-text">Stage Videos</span></h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {[
                                    { url: "https://www.youtube.com/embed/NrX2DzcYa3A", title: "Scientific Memory Systems: Live Institutional Demo" },
                                    { url: "https://www.youtube.com/embed/46r5IVlZ4CU", title: "Memory Mastery: Quick Techniques for Students" },
                                    { url: "https://www.youtube.com/embed/nyqOo_qwVz4", title: "Brain Potential & Focus: Stage Workshop Highlights" },
                                    { url: "https://www.youtube.com/embed/X_qNtECJ_d4", title: "Memory Guru in Action: Public Seminar Snippet" }
                                ].map((video, idx) => (
                                    <div key={idx} className="space-y-4 group text-center md:text-left">
                                        <div className="relative aspect-video bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white transition-transform duration-500 hover:-translate-y-2">
                                            <iframe
                                                src={video.url}
                                                title={video.title}
                                                className="w-full h-full border-0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                        <p className="text-gray-900 font-bold text-lg px-2">{video.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Media Gallery */}
                        <div className="pt-10 border-t border-gray-100" data-aos="fade-up">
                            <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Moments</span>
                            <h2 className="text-3xl md:text-4xl text-gray-900 mb-10">Event <span className="gradient-text">Gallery</span></h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[
                                    { img: '/assets/memory_guru/mixcollage-1.jpg', title: 'Seminar Photographs' },
                                    { img: '/assets/memory_guru/mixcollage-2.jpg', title: 'Stage Appearances' },
                                    { img: '/assets/memory_guru/mixcollage-3.jpg', title: 'Institutional Events' },
                                    { img: '/assets/memory_guru/mixcollage-4.jpg', title: 'Workshop Highlights' }
                                ].map((item, i) => (
                                    <div key={i} className="group relative overflow-hidden rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-500 h-128 border border-white">
                                        <img src={item.img} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-indigo-900/20 to-transparent flex items-end p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white text-xl">{item.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Audience Testimonials */}
                            <div className="mt-12 bg-indigo-50/50 backdrop-blur-md rounded-[2.5rem] p-10 border border-indigo-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-10 text-9xl text-indigo-200/20 font-serif leading-none">"</div>
                                <h3 className="text-2xl text-gray-900 mb-10 flex items-center gap-3">
                                    <span className="text-3xl">✨</span> Audience Testimonials
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white/80 p-8 rounded-3xl shadow-sm italic text-gray-700 relative group hover:shadow-md transition-shadow">
                                        <p className="relative z-10 text-lg">"The memory coding systems Rajesh taught are simply life-changing. I could memorize 50 words in order in just minutes!"</p>
                                        <div className="mt-6 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">B</div>
                                            <p className="not-italic text-gray-900">Board Exam Student</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/80 p-8 rounded-3xl shadow-sm italic text-gray-700 relative group hover:shadow-md transition-shadow">
                                        <p className="relative z-10 text-lg">"A high-impact session. The techniques for name-face association are extremely practical for networking and professional growth."</p>
                                        <div className="mt-6 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">C</div>
                                            <p className="not-italic text-gray-900">Corporate Professional</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <Link
                                    to="/book"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                                >
                                    Courses <ArrowRight size={20} />
                                </Link>
                                <Link
                                    to="#"
                                    className="bg-white hover:bg-gray-50 text-indigo-900 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Play size={20} className="text-indigo-600" /> Watch Live Demo
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MemoryGuruAbout;
