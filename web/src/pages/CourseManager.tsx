import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';
import { Book, Link as LinkIcon, Plus, Trash2, ArrowLeft } from 'lucide-react';

export const CourseManager: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [courseForm, setCourseForm] = useState({ title: '', description: '' });

    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [materialForm, setMaterialForm] = useState({ title: '', url: '', material_type: 'LINK' });

    useEffect(() => {
        if (user?.role !== 'TUTOR') {
            navigate('/dashboard');
            return;
        }
        loadCourses();
    }, [user, navigate]);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await api.edu.getCourses();
            // Filter only courses taught by the current tutor
            const myCourses = data.filter((c: any) => c.teacher_id === (user?.id || 0));
            setCourses(myCourses);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const loadMaterials = async (courseId: number) => {
        try {
            const data = await api.edu.getCourseMaterials(courseId);
            setMaterials(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectCourse = (course: any) => {
        setSelectedCourse(course);
        loadMaterials(course.id);
        setShowCourseForm(false);
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.edu.createCourse({ ...courseForm, teacher_id: user?.id, price: 0 });
            await loadCourses();
            setShowCourseForm(false);
            setCourseForm({ title: '', description: '' });
        } catch (e) {
            console.error(e);
            alert("Failed to create course");
        }
    };

    const handleAddMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;
        try {
            await api.edu.addCourseMaterial(selectedCourse.id, materialForm);
            await loadMaterials(selectedCourse.id);
            setShowMaterialForm(false);
            setMaterialForm({ title: '', url: '', material_type: 'LINK' });
        } catch (e) {
            console.error(e);
            alert("Failed to add material");
        }
    };

    const handleDeleteMaterial = async (materialId: number) => {
        if (!window.confirm("Delete this material?")) return;
        try {
            await api.edu.deleteCourseMaterial(materialId);
            if (selectedCourse) loadMaterials(selectedCourse.id);
        } catch (e) {
            console.error(e);
            alert("Failed to delete material");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-[#FFF9F0]">
            <Header />
            <main className="flex-1 container mx-auto p-6 md:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Course Manager</h2>
                        <p className="text-gray-600">Create courses, manage batches, and upload class materials.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Course List */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900">My Courses</h3>
                            <button 
                                onClick={() => { setShowCourseForm(true); setSelectedCourse(null); }}
                                className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {courses.map(course => (
                                <div 
                                    key={course.id}
                                    onClick={() => handleSelectCourse(course)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedCourse?.id === course.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-200'}`}
                                >
                                    <h4 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1">{course.description}</p>
                                </div>
                            ))}
                            {courses.length === 0 && !showCourseForm && (
                                <p className="text-sm text-gray-400 text-center py-4">No courses yet. Click + to create.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Area - Editor / Details */}
                    <div className="lg:col-span-3">
                        {showCourseForm ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Course</h3>
                                <form onSubmit={handleCreateCourse} className="space-y-4 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Course Title</label>
                                        <input 
                                            required 
                                            type="text" 
                                            value={courseForm.title} 
                                            onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                        <textarea 
                                            value={courseForm.description} 
                                            onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none h-32"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700">Create</button>
                                        <button type="button" onClick={() => setShowCourseForm(false)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-200">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        ) : selectedCourse ? (
                            <div className="space-y-6">
                                {/* Course Header Info */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h3>
                                    <p className="text-gray-600 mt-2">{selectedCourse.description}</p>
                                </div>

                                {/* Materials Section */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Book className="text-indigo-600" size={20} />
                                            Class Materials
                                        </h4>
                                        <button 
                                            onClick={() => setShowMaterialForm(true)}
                                            className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1"
                                        >
                                            <Plus size={16} /> Add Material
                                        </button>
                                    </div>

                                    {showMaterialForm && (
                                        <form onSubmit={handleAddMaterial} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                                                    <input required type="text" value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. Week 1 Slides"/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                                                    <select value={materialForm.material_type} onChange={e => setMaterialForm({...materialForm, material_type: e.target.value})} className="w-full border rounded-lg p-2 text-sm bg-white">
                                                        <option value="LINK">External Link</option>
                                                        <option value="PDF">PDF URL</option>
                                                        <option value="VIDEO">Video URL</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">URL / Link</label>
                                                <input required type="url" value={materialForm.url} onChange={e => setMaterialForm({...materialForm, url: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="https://drive.google.com/..."/>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Save</button>
                                                <button type="button" onClick={() => setShowMaterialForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold">Cancel</button>
                                            </div>
                                        </form>
                                    )}

                                    {materials.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">No materials uploaded yet.</p>
                                    ) : (
                                        <div className="grid gap-3">
                                            {materials.map(m => (
                                                <div key={m.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:shadow-sm transition-all group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            <LinkIcon size={18} />
                                                        </div>
                                                        <div>
                                                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-indigo-600 block">{m.title}</a>
                                                            <span className="text-xs font-semibold text-gray-500">{m.material_type}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteMaterial(m.id)} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-100 border-dashed text-gray-400 p-12">
                                <Book size={48} className="mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Select a course to manage</p>
                                <p className="text-sm mt-1">Or create a new one to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};
