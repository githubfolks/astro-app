import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';
import { Book as BookIcon, ArrowRight, Star, Users, Clock } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import SEO from '../components/SEO';

const Book: React.FC = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: false,
            mirror: true,
            offset: 100
        });
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await api.edu.getCourses();
            setCourses(data);
        } catch (e) {
            console.error('Failed to load courses:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SEO
                title="Courses | Aadikarta - Learn Vedic Astrology & Memory Mastery"
                description="Explore our comprehensive courses in Vedic Astrology, Memory Mastery, and Spiritual Sciences taught by verified experts."
            />
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 bg-indigo-900 overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.4),transparent_70%)]"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-left">
                            <div className="w-full md:w-2/3">
                                <h1 className="hero-title mt-2 text-white mb-6" data-aos="fade-right" data-aos-delay="100">
                                    Our <span className="text-yellow-400">Courses</span>
                                </h1>
                                <p className="text-xl text-indigo-100 leading-relaxed" data-aos="fade-right" data-aos-delay="200">
                                    Rajesh Chaudhary (Memory Guru) is an India Book of Records recognized memory trainer and motivational speaker who has conducted thousands of memory enhancement sessions for students and educators. His programs focus on concentration, rapid recall, and scientific memory techniques that improve academic and professional performance.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center" data-aos="fade-left" data-aos-delay="300">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                    <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-8 border-indigo-800/50 shadow-2xl">
                                        <img
                                            src="/assets/rajesh.jpg"
                                            alt="Rajesh Chaudhary - Memory Guru"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Course List Section */}
                <section className="py-24 bg-gray-50/50 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

                    <div className="container mx-auto px-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                                <p className="text-gray-500 font-medium">Loading courses...</p>
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200" data-aos="fade-up">
                                <BookIcon size={64} className="mx-auto text-gray-300 mb-6" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">No courses available yet</h2>
                                <p className="text-gray-600">We're currently preparing new learning materials for you. Stay tuned!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {courses.map((course, index) => (
                                    <div
                                        key={course.id}
                                        className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group flex flex-col h-full"
                                        data-aos="fade-up"
                                        data-aos-delay={index * 100}
                                    >
                                        <div className="p-8 flex-1">
                                            <div className="mb-6 bg-indigo-100/50 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-500 group-hover:bg-indigo-600 group-hover:text-white">
                                                <BookIcon size={32} />
                                            </div>

                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < 4 ? "currentColor" : "none"} />)}
                                                </div>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Rated</span>
                                            </div>

                                            <h3 className="step-title">
                                                {course.title}
                                            </h3>

                                            <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                                                {course.description || "Unlock the secrets of cosmic wisdom with this comprehensive course guided by our verified experts."}
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 mt-auto">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Users size={16} />
                                                    <span className="text-sm font-medium">1.2k+ Students</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Clock size={16} />
                                                    <span className="text-sm font-medium">12+ Hours</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 pt-0 mt-auto">
                                            <button className="w-full bg-indigo-50 text-indigo-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                View Course Details <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Book;
