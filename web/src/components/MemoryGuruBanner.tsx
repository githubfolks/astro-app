import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Users, Building2, Laptop, ArrowRight, Play, FileText } from 'lucide-react';

const MemoryGuruBanner: React.FC = () => {
    return (
        <section className="py-24 relative overflow-hidden bg-white">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50/50 rounded-l-[100px] transform translate-x-32"></div>
            <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute top-40 right-40 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Text Content */}
                    <div className="lg:w-3/5" data-aos="fade-right">
                        <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block flex items-center gap-2">
                            <Brain size={18} />
                            Memory Mastery Program
                        </span>

                        <h2 className="text-3xl md:text-4xl text-gray-900 mb-6">
                            Unlock Extraordinary Memory Power with <span className="text-indigo-600">Rajesh Chaudhary</span> – Memory Guru
                        </h2>

                        <p className="text-xl text-gray-600 leading-relaxed mb-8">
                            India's recognized memory trainer helping students, professionals, and institutions master concentration, recall, and accelerated learning through scientific memory techniques.
                        </p>

                        {/* Program Tags */}
                        <div className="flex flex-wrap gap-4 mb-10">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm font-semibold text-gray-700">
                                <Users size={16} className="text-indigo-500" />
                                Live Workshops
                            </div>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm font-semibold text-gray-700">
                                <Building2 size={16} className="text-purple-500" />
                                Institutional Programs
                            </div>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm font-semibold text-gray-700">
                                <Building2 size={16} className="text-amber-500" />
                                Corporate Sessions
                            </div>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-sm font-semibold text-gray-700">
                                <Laptop size={16} className="text-rose-500" />
                                Online Masterclasses
                            </div>
                        </div>

                        {/* Buttons */}
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
                            <Link
                                to="/memory-guru"
                                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <FileText size={20} className="text-gray-500" /> About Guru
                            </Link>
                        </div>
                    </div>

                    {/* Image / Photo Placeholder */}
                    <div className="lg:w-2/5" data-aos="fade-left">
                        <div className="bg-gradient-to-tr from-indigo-100 to-purple-50 rounded-[3rem] p-4 relative">
                            {/* Decorative border */}
                            <div className="absolute inset-0 border-2 border-indigo-200 border-dashed rounded-[3rem] -m-4"></div>

                            <img
                                src="/assets/memory_guru/rajesh-1.jpeg"
                                alt="Rajesh Chaudhary - Memory Guru"
                                className="w-full h-[500px] object-cover rounded-[2.5rem] shadow-2xl relative z-10 filter contrast-110"
                            />

                            {/* Floating Badge */}
                            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl z-20 flex items-center gap-4 border border-gray-100">
                                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-600 text-2xl">
                                    ✓
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">10,000+</p>
                                    <p className="text-gray-500 text-sm font-medium">Students Trained</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MemoryGuruBanner;
