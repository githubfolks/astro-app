import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/api';
import { Book, Link as LinkIcon, Plus, Trash2, ArrowLeft, Users, Calendar, Edit2 } from 'lucide-react';

export const CourseManager: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [courseForm, setCourseForm] = useState({ title: '', description: '', price: 0, is_active: true });

    const [batches, setBatches] = useState<any[]>([]);
    const [showBatchForm, setShowBatchForm] = useState(false);
    const [batchForm, setBatchForm] = useState({ name: '', max_students: 10 });

    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [materialForm, setMaterialForm] = useState({ title: '', url: '', material_type: 'LINK' });

    const [showSessionForm, setShowSessionForm] = useState<number | null>(null); // batchId
    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
    const [sessionForm, setSessionForm] = useState({ title: '', scheduled_start: '', scheduled_end: '', is_active: true });

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
            const data = await api.edu.getMyCourses();
            setCourses(data);
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
        setBatches(course.batches || []);
        setShowCourseForm(false);
        setIsEditing(false);
        setShowBatchForm(false);
        setShowMaterialForm(false);
        setShowSessionForm(null);
        setEditingSessionId(null);
    };

    const loadBatches = async (courseId: number) => {
        try {
            const data = await api.edu.getMyCourses();
            const course = data.find((c: any) => c.id === courseId);
            if (course) {
                setBatches(course.batches || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && selectedCourse) {
                await api.edu.updateCourse(selectedCourse.id, courseForm);
            } else {
                await api.edu.createCourse({ ...courseForm, teacher_id: user?.id });
            }
            await loadCourses();
            setShowCourseForm(false);
            setIsEditing(false);
            setCourseForm({ title: '', description: '', price: 0, is_active: true });
            
            // Re-select course to refresh details if editing
            if (isEditing && selectedCourse) {
                const updatedCourses = await api.edu.getCourses();
                const updated = updatedCourses.find((c: any) => c.id === selectedCourse.id);
                if (updated) setSelectedCourse(updated);
            }
        } catch (e) {
            console.error(e);
            alert(`Failed to ${isEditing ? 'update' : 'create'} course`);
        }
    };

    const handleEditCourse = () => {
        if (!selectedCourse) return;
        setCourseForm({
            title: selectedCourse.title,
            description: selectedCourse.description,
            price: selectedCourse.price,
            is_active: selectedCourse.is_active
        });
        setIsEditing(true);
        setShowCourseForm(true);
    };

    const handleCreateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;
        try {
            await api.edu.createBatch({ ...batchForm, course_id: selectedCourse.id });
            await loadBatches(selectedCourse.id);
            setShowBatchForm(false);
            setBatchForm({ name: '', max_students: 10 });
        } catch (e) {
            console.error(e);
            alert("Failed to create batch");
        }
    };

    const handleEditSession = (session: any, batchId: number) => {
        // Convert ISO to datetime-local format (YYYY-MM-DDTHH:MM)
        const start = new Date(session.scheduled_start).toISOString().slice(0, 16);
        const end = new Date(session.scheduled_end).toISOString().slice(0, 16);
        
        setSessionForm({
            title: session.title,
            scheduled_start: start,
            scheduled_end: end,
            is_active: session.is_active
        });
        setEditingSessionId(session.id);
        setShowSessionForm(batchId);
    };

    const handleScheduleSession = async (e: React.FormEvent, batchId: number) => {
        e.preventDefault();
        try {
            const data = {
                ...sessionForm,
                scheduled_start: new Date(sessionForm.scheduled_start).toISOString(),
                scheduled_end: new Date(sessionForm.scheduled_end).toISOString()
            };

            if (editingSessionId) {
                await api.edu.updateSession(editingSessionId, data);
            } else {
                // Generate a simple unique room ID if not provided
                const room_id = `room-${batchId}-${Date.now()}`;
                await api.edu.scheduleSession({
                    ...data,
                    batch_id: batchId,
                    miro_room_id: room_id
                });
            }
            
            await loadBatches(selectedCourse?.id);
            setShowSessionForm(null);
            setEditingSessionId(null);
            setSessionForm({ title: '', scheduled_start: '', scheduled_end: '', is_active: true });
        } catch (e) {
            console.error(e);
            alert(`Failed to ${editingSessionId ? 'update' : 'schedule'} session`);
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
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h4>
                                        {!course.is_active && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>}
                                    </div>
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
                                <h3 className="text-xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit Course' : 'Create New Course'}</h3>
                                <form onSubmit={handleSaveCourse} className="space-y-4 max-w-lg">
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
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Course Price (INR)</label>
                                        <input 
                                            required 
                                            type="number" 
                                            value={courseForm.price} 
                                            onChange={e => setCourseForm({...courseForm, price: parseInt(e.target.value)})}
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                                            placeholder="0 for free"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            id="course_is_active"
                                            checked={courseForm.is_active} 
                                            onChange={e => setCourseForm({...courseForm, is_active: e.target.checked})}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600"
                                        />
                                        <label htmlFor="course_is_active" className="text-sm font-semibold text-gray-700">Course is Active (Visible to students)</label>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700">
                                            {isEditing ? 'Save Changes' : 'Create'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => { setShowCourseForm(false); setIsEditing(false); }} 
                                            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : selectedCourse ? (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 mr-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h3>
                                                {!selectedCourse.is_active && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase">Inactive</span>}
                                                <button 
                                                    onClick={handleEditCourse}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit Course"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                            </div>
                                            <p className="text-gray-600">{selectedCourse.description}</p>
                                        </div>
                                        <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shrink-0">
                                            <span className="text-xs font-bold text-indigo-600 uppercase block tracking-wider">Price</span>
                                            <span className="text-xl font-bold text-indigo-900">₹{selectedCourse.price}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Batches Section */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Users className="text-indigo-600" size={20} />
                                            Batches
                                        </h4>
                                        <button 
                                            onClick={() => setShowBatchForm(true)}
                                            className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1"
                                        >
                                            <Plus size={16} /> Create Batch
                                        </button>
                                    </div>

                                    {showBatchForm && (
                                        <form onSubmit={handleCreateBatch} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Batch Name</label>
                                                    <input required type="text" value={batchForm.name} onChange={e => setBatchForm({...batchForm, name: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. Batch A - Spring 2026"/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Max Students</label>
                                                    <input required type="number" value={batchForm.max_students} onChange={e => setBatchForm({...batchForm, max_students: parseInt(e.target.value)})} className="w-full border rounded-lg p-2 text-sm bg-white" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Create</button>
                                                <button type="button" onClick={() => setShowBatchForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold">Cancel</button>
                                            </div>
                                        </form>
                                    )}

                                    {batches.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">No batches created for this course yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {batches.map(b => (
                                                <div key={b.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h5 className="font-bold text-gray-900">{b.name}</h5>
                                                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">ID: {b.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                                        <div className="flex items-center gap-1">
                                                            <Users size={14} /> {b.max_students} Max
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={14} /> Created {new Date(b.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-gray-100">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Enrolled Students ({b.enrollments?.length || 0})</span>
                                                        {(!b.enrollments || b.enrollments.length === 0) ? (
                                                            <p className="text-[10px] text-gray-400 italic">No students yet.</p>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1 mb-3">
                                                                {b.enrollments.map((e: any) => (
                                                                    <div key={e.id} title={e.user?.email} className="bg-white text-indigo-700 px-2 py-1 rounded-md text-[10px] font-semibold border border-indigo-100 shadow-sm">
                                                                        {e.user?.email.split('@')[0]}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="mt-4 border-t border-gray-100 pt-3">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scheduled Sessions</span>
                                                                <button 
                                                                    onClick={() => setShowSessionForm(b.id)}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
                                                                >
                                                                    + Schedule
                                                                </button>
                                                            </div>

                                                            {showSessionForm === b.id && (
                                                                <form onSubmit={(e) => handleScheduleSession(e, b.id)} className="bg-white p-3 rounded-lg border border-indigo-100 mb-3 space-y-2">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div>
                                                                            <label className="text-[8px] text-gray-500 block">Start</label>
                                                                            <input required type="datetime-local" value={sessionForm.scheduled_start} onChange={e => setSessionForm({...sessionForm, scheduled_start: e.target.value})} className="w-full text-[10px] border p-1 rounded" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[8px] text-gray-500 block">End</label>
                                                                            <input required type="datetime-local" value={sessionForm.scheduled_end} onChange={e => setSessionForm({...sessionForm, scheduled_end: e.target.value})} className="w-full text-[10px] border p-1 rounded" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            id={`session_is_active_${b.id}`}
                                                                            checked={sessionForm.is_active} 
                                                                            onChange={e => setSessionForm({...sessionForm, is_active: e.target.checked})}
                                                                            className="w-3 h-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600"
                                                                        />
                                                                        <label htmlFor={`session_is_active_${b.id}`} className="text-[10px] font-semibold text-gray-700">Session is Active</label>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button type="submit" className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold">
                                                                            {editingSessionId ? 'Save' : 'Add'}
                                                                        </button>
                                                                        <button type="button" onClick={() => { setShowSessionForm(null); setEditingSessionId(null); setSessionForm({ title: '', scheduled_start: '', scheduled_end: '', is_active: true }); }} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold">Cancel</button>
                                                                    </div>
                                                                </form>
                                                            )}

                                                            <div className="space-y-2">
                                                                {(b.sessions || []).map((s: any) => (
                                                                    <div key={s.id} className="flex justify-between items-center p-2 border border-gray-100 rounded-lg bg-white group">
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="font-bold text-gray-800">{s.title}</div>
                                                                                {!s.is_active && <span className="text-[8px] bg-gray-200 text-gray-600 px-1 rounded font-bold uppercase">Inactive</span>}
                                                                            </div>
                                                                            <div className="text-gray-500">
                                                                                {new Date(s.scheduled_start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                            </div>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => handleEditSession(s, b.id)}
                                                                            className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <Edit2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {(!b.sessions || b.sessions.length === 0) && (
                                                                    <p className="text-[10px] text-gray-400 italic">No sessions scheduled.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
