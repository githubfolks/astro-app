import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';
import { Book as BookIcon, ArrowRight, Star, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

const Book: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
    const [materials, setMaterials] = useState<any[]>([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);
    const [enrollmentStatus, setEnrollmentStatus] = useState<{
        loading: boolean;
        success: boolean;
        error: string | null;
    }>({ loading: false, success: false, error: null });

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

    const handleViewDetails = async (course: any) => {
        setSelectedCourse(course);
        setEnrollmentStatus({ loading: false, success: false, error: null });
        setLoadingMaterials(true);
        setMaterials([]);
        try {
            const data = await api.edu.getCourseMaterials(course.id);
            setMaterials(data);
        } catch (e) {
            console.error('Failed to load materials:', e);
        } finally {
            setLoadingMaterials(false);
        }
    };

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/book', courseId: selectedCourse.id } });
            return;
        }

        if (!selectedCourse.batches || selectedCourse.batches.length === 0) {
            setEnrollmentStatus({ 
                loading: false, 
                success: false, 
                error: 'No active batches available for this course. Please contact support.' 
            });
            return;
        }

        setEnrollmentStatus({ loading: true, success: false, error: null });
        try {
            await api.edu.enroll({ 
                user_id: user?.id, 
                batch_id: selectedCourse.batches[0].id 
            });
            setEnrollmentStatus({ loading: false, success: true, error: null });
            loadCourses(); // Refresh courses to get updated is_enrolled status
        } catch (e: any) {
            setEnrollmentStatus({
                loading: false,
                success: false,
                error: e.message || 'Enrollment failed. Please try again or contact support.'
            });
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
                                <h1 className="hero-title mt-2 font-bold text-4xl text-white mb-6" data-aos="fade-right" data-aos-delay="100">
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

                                            <h3 className="step-title font-bold">
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
                                            <button
                                                onClick={() => handleViewDetails(course)}
                                                className="w-full bg-indigo-50 text-indigo-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300"
                                            >
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

            {/* Course Details Modal */}
            {selectedCourse && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-300"
                        data-aos="zoom-in"
                    >
                        <button
                            onClick={() => setSelectedCourse(null)}
                            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-8 md:p-12">
                            <div className="inline-flex items-center gap-2 text-indigo-600 text-sm uppercase tracking-widest mb-6 px-4 py-2 bg-indigo-50 rounded-xl">
                                <BookIcon size={16} /> Course Curriculum
                            </div>

                            <h2 className="text-3xl md:text-4xl text-gray-900 mb-6 leading-tight">
                                {selectedCourse.title}
                            </h2>

                            <div className="prose prose-indigo max-w-none text-gray-600 mb-10 text-lg leading-relaxed">
                                {selectedCourse.description || "Detailed course overview goes here..."}
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-gray-900 text-xl flex items-center gap-2">
                                    <Users className="text-indigo-600" size={24} />
                                    What's included in this course:
                                </h4>

                                {loadingMaterials ? (
                                    <div className="flex items-center gap-3 text-indigo-600 py-6">
                                        <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                        <span className="font-medium">Fetching materials...</span>
                                    </div>
                                ) : materials.length > 0 ? (
                                    <div className="grid gap-4">
                                        {materials.map((m: any) => (
                                            <div key={m.id} className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-colors">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <BookIcon size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 leading-none mb-1">{m.title}</p>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{m.material_type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
                                        No specific materials have been shared publicly for this course yet.
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 flex flex-col sm:flex-row gap-4">
                                {(enrollmentStatus.success || selectedCourse.is_enrolled) ? (
                                    <div className="flex-1 bg-green-50 text-green-700 py-4 px-6 rounded-xl font-bold text-center flex items-center justify-center gap-2 border border-green-200">
                                        <CheckCircle size={20} /> Already Enrolled
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        disabled={enrollmentStatus.loading}
                                        className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {enrollmentStatus.loading ? (
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : null}
                                        {enrollmentStatus.loading ? 'Processing...' : 'Enroll in Batch'}
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all"
                                >
                                    Close Details
                                </button>
                            </div>

                            {enrollmentStatus.error && (
                                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-100 animate-in slide-in-from-top-2">
                                    <AlertCircle size={18} />
                                    <span className="text-sm font-medium">{enrollmentStatus.error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Book;
