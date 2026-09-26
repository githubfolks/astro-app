import type { Batch, Course, CourseMaterial } from '../types';
import { getErrorMessage, getErrorStatus } from '../utils/errors';
import { formatDuration, formatSessionWhen, summarizeBatch } from '../utils/classSchedule';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';
import { Book as BookIcon, ArrowRight, Users, Clock, CheckCircle, AlertCircle, Calendar, Video } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

const bookStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://aadikarta.org/book#page',
    name: 'Astrology & Memory Mastery Courses',
    url: 'https://aadikarta.org/book',
    description: 'Online courses in Vedic Astrology, Memory Mastery, and Spiritual Sciences from verified expert instructors on Aadikarta.',
    publisher: { '@id': 'https://aadikarta.org/#organization' },
    about: [
        { '@type': 'Thing', name: 'Vedic Astrology' },
        { '@type': 'Thing', name: 'Memory Training' },
        { '@type': 'Thing', name: 'Spiritual Sciences' },
    ],
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

/** Real facts for a course card, derived from its open batches. */
const CourseCardFacts: React.FC<{ course: Course }> = ({ course }) => {
    const summaries = (course.batches || []).map(summarizeBatch);
    const openCount = summaries.filter((s) => !s.isFull).length;
    const nextClass = summaries
        .map((s) => s.nextStart)
        .filter((d): d is string => !!d)
        .sort()[0];
    const hasAnyClass = summaries.some((s) => s.classCount > 0);
    const dateLabel = nextClass
        ? `Next class ${formatDate(nextClass)}`
        : hasAnyClass ? 'No upcoming classes' : 'Dates to be announced';
    return (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-2 text-gray-900">
                <Users size={16} />
                <span className="text-sm font-medium">
                    {openCount ? `${openCount} batch${openCount > 1 ? 'es' : ''} open` : 'No open batches'}
                </span>
            </div>
            <div className="flex items-center gap-2 text-gray-900">
                <Calendar size={16} />
                <span className="text-sm font-medium">{dateLabel}</span>
            </div>
        </div>
    );
};

/** One selectable batch in the course details modal. */
const BatchOption: React.FC<{
    batch: Batch;
    selected: boolean;
    enrolled: boolean;
    disabled: boolean;
    onSelect: () => void;
}> = ({ batch, selected, enrolled, disabled, onSelect }) => {
    const s = summarizeBatch(batch);
    return (
        <label
            className={`block p-3 rounded-xl border-2 transition-colors ${selected ? 'border-indigo-600 bg-indigo-50/60' : 'border-gray-100 bg-gray-50'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-200'}`}
        >
            <div className="flex items-start gap-3">
                <input
                    type="radio"
                    name="batch"
                    className="mt-1 accent-indigo-600"
                    checked={selected}
                    disabled={disabled}
                    onChange={onSelect}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-gray-900">{batch.name}</span>
                        {enrolled ? (
                            <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-md">Your batch</span>
                        ) : s.seatsLeft != null && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${s.isFull ? 'text-red-700 bg-red-100' : 'text-indigo-700 bg-indigo-100'}`}>
                                {s.isFull ? 'Full' : `${s.seatsLeft} of ${batch.max_students} seats left`}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} /> {s.firstStart
                                ? `${s.hasStarted ? 'Started' : 'Starts'} ${formatDate(s.firstStart)}${s.hasStarted && s.nextStart ? ` · next class ${formatDate(s.nextStart)}` : ''}`
                                : 'Schedule to be announced'}
                        </span>
                        {s.classCount > 0 && (
                            <span className="flex items-center gap-1">
                                <Clock size={12} /> {s.classCount} class{s.classCount > 1 ? 'es' : ''}{s.totalTime ? ` · ${s.totalTime} total` : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </label>
    );
};

const Book: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);
    const [enrollmentStatus, setEnrollmentStatus] = useState<{
        loading: boolean;
        success: boolean;
        error: string | null;
        insufficientBalance: boolean;
    }>({ loading: false, success: false, error: null, insufficientBalance: false });

    // AOS is a single shared module instance across the whole app, and its config
    // is merged (not replaced) on every AOS.init() call. AstrologerList.tsx inits
    // it with `disable: 'mobile'`, which then silently sticks for every other
    // page's AOS.init() too (since they don't pass `disable` at all) if that
    // component mounted first (e.g. via the home page) - AOS then tears down
    // data-aos attributes instead of animating them. Passing `disable: false`
    // explicitly here resets it back regardless of what ran before.
    const aosOptions = {
        duration: 1000,
        once: false,
        mirror: true,
        offset: 100,
        disable: false,
    };

    useEffect(() => {
        AOS.init(aosOptions);
        loadCourses();
    }, []);

    // Course cards mount asynchronously after the fetch resolves, i.e. after the
    // page's initial AOS.init() already ran and only saw the (still-empty) course
    // list in the DOM. Re-running init() rescans the DOM for the newly rendered
    // data-aos nodes; without it they stay stuck at the library's opacity:0 default.
    useEffect(() => {
        if (!loading) {
            AOS.init(aosOptions);
        }
    }, [courses, loading]);

    // After being sent to /login mid-enrollment (see handleEnroll below) and coming
    // back authenticated, Login.tsx forwards us here with the course the user was
    // viewing so they land back in its details modal instead of the bare course list.
    useEffect(() => {
        const returnCourseId = (location.state as { courseId?: number } | null)?.courseId;
        if (!loading && returnCourseId != null) {
            const course = courses.find((c) => c.id === returnCourseId);
            if (course) {
                handleViewDetails(course);
            }
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, courses]);

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

    const handleViewDetails = async (course: Course) => {
        setSelectedCourse(course);
        setEnrollmentStatus({ loading: false, success: false, error: null, insufficientBalance: false });
        // Pre-select the student's own batch, else the first batch with seats left.
        const defaultBatch = course.enrolled_batch_id
            ?? (course.batches || []).find((b) => !summarizeBatch(b).isFull)?.id
            ?? null;
        setSelectedBatchId(defaultBatch);
        setMaterials([]);
        // Materials are only served to enrolled students.
        if (!course.is_enrolled) return;
        setLoadingMaterials(true);
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
        if (!selectedCourse) return;
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/book', courseId: selectedCourse.id } });
            return;
        }

        const batch = (selectedCourse.batches || []).find((b) => b.id === selectedBatchId);
        if (!batch) {
            setEnrollmentStatus({
                loading: false,
                success: false,
                error: 'Please choose a batch to enroll in.',
                insufficientBalance: false
            });
            return;
        }

        setEnrollmentStatus({ loading: true, success: false, error: null, insufficientBalance: false });
        try {
            if (Number(selectedCourse.price ?? 0) > 0) {
                const confirmed = window.confirm(`Enroll in "${batch.name}"? The course fee of ₹${selectedCourse.price} will be deducted from your wallet balance.`);
                if (!confirmed) {
                    setEnrollmentStatus({ loading: false, success: false, error: null, insufficientBalance: false });
                    return;
                }
            }

            await api.edu.enroll({
                user_id: user?.id,
                batch_id: batch.id
            });
            // Show the student's batch and load the now-unlocked materials.
            await handleViewDetails({ ...selectedCourse, is_enrolled: true, enrolled_batch_id: batch.id });
            setEnrollmentStatus({ loading: false, success: true, error: null, insufficientBalance: false });
            loadCourses(); // Refresh the list (seat counts, enrolled flags)
        } catch (e) {
            const isInsufficientBalance = getErrorStatus(e) === 402;
            const errorMsg = getErrorMessage(e) || 'Enrollment failed. Please try again or contact support.';
            setEnrollmentStatus({
                loading: false,
                success: false,
                error: errorMsg,
                insufficientBalance: isInsufficientBalance
            });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SEO
                title="Courses | Learn Vedic Astrology & Memory Mastery | Aadikarta Vedic Astrology"
                description="Explore comprehensive online courses in Vedic Astrology, Memory Mastery, and Spiritual Sciences on Aadikarta Vedic Astrology taught by verified experts."
                keywords="Aadikarta Vedic Astrology courses, learn Vedic astrology online, memory mastery course, astrology classes Aadikarta"
                structuredData={bookStructuredData}
            />
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-8 pb-14 md:py-20 bg-indigo-900 overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.4),transparent_70%)]"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-left">
                            <div className="w-full md:w-2/3">
                                <h1 className="hero-title text-3xl md:text-4xl text-white mb-6" data-aos="fade-right" data-aos-delay="100">
                                    Our <span className="text-yellow-400">Courses</span>
                                </h1>
                                <p className="text-lg text-indigo-100 leading-relaxed text-justify" data-aos="fade-right" data-aos-delay="200">
                                    Rajesh Chaudhary (Memory Guru) is an India Book of Records recognized memory trainer and motivational speaker who has conducted thousands of memory enhancement sessions for students and educators. His programs focus on concentration, rapid recall, and scientific memory techniques that improve academic and professional performance.
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center" data-aos="fade-left" data-aos-delay="300">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                    <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-8 border-indigo-800/50 shadow-2xl">
                                        <img
                                            src="/assets/memory_guru/rajesh-1.jpeg"
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
                                <p className="text-gray-900 font-medium">Loading courses...</p>
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
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="bg-indigo-100/50 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-500 group-hover:bg-indigo-600 group-hover:text-white">
                                                    <BookIcon size={32} />
                                                </div>
                                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                                    <Video size={14} /> Live online
                                                </span>
                                            </div>

                                            <h3 className="step-title font-bold mb-1 text-center">
                                                {course.title}
                                            </h3>
                                            <div className="mb-2 flex items-baseline justify-center gap-1">
                                                <span className="text-2xl font-black text-indigo-600">₹{course.price}</span>
                                                {Number(course.price) === 0 && <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-md">Free</span>}
                                            </div>

                                            {course.description && (
                                                <p className="text-gray-600 leading-snug mb-2 line-clamp-3">{course.description}</p>
                                            )}

                                            <CourseCardFacts course={course} />
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
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-sm animate-in fade-in duration-300">
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

                        <div className="p-6 md:p-8 text-center">
                            <div className="inline-flex items-center gap-2 text-indigo-600 text-xs uppercase tracking-widest mb-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
                                <BookIcon size={16} /> Course Curriculum
                            </div>

                            <h2 className="text-xl md:text-2xl text-gray-900 mb-2 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                                {selectedCourse.title}
                            </h2>

                            <div className="bg-indigo-50 inline-flex flex-col items-center px-4 py-2 rounded-xl border border-indigo-100 mb-3 mx-auto">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">Course Fee</span>
                                <span className="text-lg font-black text-indigo-600">₹{selectedCourse.price}</span>
                            </div>

                            {selectedCourse.description && (
                                <div className="prose prose-indigo max-w-none text-gray-600 mb-4 text-sm leading-snug text-left">
                                    {selectedCourse.description}
                                </div>
                            )}

                            <div className="flex items-start gap-2 p-3 mb-5 bg-indigo-50/60 rounded-xl text-left text-xs text-indigo-900">
                                <Video size={16} className="shrink-0 text-indigo-600" />
                                <span>
                                    Live online classes by video. After enrolling, join each class from your Dashboard — the room opens 10 minutes before the start time.
                                </span>
                            </div>

                            {(() => {
                                const batches = selectedCourse.batches || [];
                                const enrolledId = selectedCourse.enrolled_batch_id ?? null;
                                const isEnrolled = enrollmentStatus.success || !!selectedCourse.is_enrolled;
                                const selectedBatch = batches.find((b) => b.id === selectedBatchId);
                                const sessions = selectedBatch?.sessions || [];
                                return (
                                    <div className="space-y-6 text-left">
                                        <div className="space-y-3">
                                            <h4 className="text-gray-900 text-base font-semibold flex items-center gap-2">
                                                <Users className="text-indigo-600" size={18} />
                                                {isEnrolled ? 'Your batch' : 'Choose a batch'}
                                            </h4>
                                            {batches.length === 0 ? (
                                                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500">
                                                    No batches are open for this course right now.
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {batches.map((b) => (
                                                        <BatchOption
                                                            key={b.id}
                                                            batch={b}
                                                            selected={b.id === selectedBatchId}
                                                            enrolled={b.id === enrolledId}
                                                            disabled={isEnrolled ? b.id !== enrolledId : summarizeBatch(b).isFull}
                                                            onSelect={() => setSelectedBatchId(b.id)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {selectedBatch && (
                                            <div className="space-y-3">
                                                <h4 className="text-gray-900 text-base font-semibold flex items-center gap-2">
                                                    <Calendar className="text-indigo-600" size={18} />
                                                    Class schedule — {selectedBatch.name}
                                                </h4>
                                                {sessions.length === 0 ? (
                                                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500">
                                                        The tutor hasn't scheduled classes for this batch yet.
                                                    </div>
                                                ) : (
                                                    <ol className="grid gap-2">
                                                        {sessions.map((s, i) => (
                                                            <li key={s.id} className="flex gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                                                                    <p className="text-xs text-gray-600">
                                                                        {formatSessionWhen(s.scheduled_start, s.scheduled_end)} · {formatDuration(s.scheduled_start, s.scheduled_end)}
                                                                    </p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="space-y-3 text-left mt-6">
                                <h4 className="text-gray-900 text-base font-semibold flex items-center gap-2">
                                    <BookIcon className="text-indigo-600" size={18} />
                                    Course materials
                                </h4>

                                {!(enrollmentStatus.success || selectedCourse.is_enrolled) ? (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500">
                                        Course materials become available after you enroll.
                                    </div>
                                ) : loadingMaterials ? (
                                    <div className="flex items-center gap-3 text-indigo-600 py-6">
                                        <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                        <span className="font-medium">Fetching materials...</span>
                                    </div>
                                ) : materials.length > 0 ? (
                                    <div className="grid gap-4">
                                        {materials.map((m: CourseMaterial) => (
                                            <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-indigo-200 transition-colors">
                                                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <BookIcon size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900 leading-none mb-1">{m.title}</p>
                                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{m.material_type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500">
                                        The tutor hasn't shared any materials yet.
                                    </div>
                                )}
                            </div>

                            {Number(selectedCourse.price ?? 0) > 0 && !(enrollmentStatus.success || selectedCourse.is_enrolled) && (
                                <p className="mt-5 text-xs text-gray-500 text-left">
                                    The course fee is paid from your wallet balance. See our{' '}
                                    <Link to="/refund-policy" className="text-indigo-600 font-semibold underline">refund policy</Link>.
                                </p>
                            )}

                            <div className="mt-5 flex flex-col sm:flex-row gap-3">
                                {(enrollmentStatus.success || selectedCourse.is_enrolled) ? (
                                    <div className="flex-1 bg-green-50 text-green-700 py-3 px-5 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2 border border-green-200">
                                        <CheckCircle size={18} /> Already Enrolled
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        disabled={enrollmentStatus.loading || selectedBatchId == null}
                                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-base hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {enrollmentStatus.loading ? (
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : null}
                                        {enrollmentStatus.loading
                                            ? 'Processing...'
                                            : `Enroll in ${(selectedCourse.batches || []).find((b) => b.id === selectedBatchId)?.name ?? 'a batch'}`}
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-base hover:bg-gray-200 transition-all"
                                >
                                    Close Details
                                </button>
                            </div>

                            {enrollmentStatus.error && (
                                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 animate-in slide-in-from-top-2 text-left">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={18} className="shrink-0" />
                                        <span className="text-sm font-medium">{enrollmentStatus.error}</span>
                                    </div>
                                    {enrollmentStatus.insufficientBalance && (
                                        <button
                                            onClick={() => navigate(`/dashboard?recharge=1`)}
                                            className="mt-3 w-full bg-red-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-red-700 transition-all"
                                        >
                                            Recharge Wallet
                                        </button>
                                    )}
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
