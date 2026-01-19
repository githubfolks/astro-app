import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import { Button, Input, TextArea } from '../components/ui';

export default function AstrologerForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        email: '',
        phone_number: '',
        password: '',
        full_name: '',
        short_bio: '',
        about_me: '',
        experience_years: 0,
        languages: '',
        specialties: '',
        consultation_fee_per_min: 0,
        availability_hours: '',
        profile_picture_url: '',
        is_verified: true
    });

    useEffect(() => {
        if (isEditMode) {
            fetchAstrologer();
        }
    }, [id]);

    const fetchAstrologer = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/astrologers_full');
            const found = response.data.astrologers.find(a => a.id === parseInt(id));

            if (found) {
                setFormData({
                    email: found.email,
                    phone_number: found.phone_number,
                    password: '',
                    full_name: found.profile.full_name,
                    short_bio: found.profile.short_bio || '',
                    about_me: found.profile.about_me || '',
                    experience_years: found.profile.experience_years || 0,
                    languages: found.profile.languages || '',
                    specialties: found.profile.specialties || '',
                    consultation_fee_per_min: found.profile.consultation_fee_per_min || 0,
                    availability_hours: found.profile.availability_hours || '',
                    profile_picture_url: found.profile.profile_picture_url || '',
                    is_verified: found.is_verified
                });
            } else {
                alert("Astrologer not found");
                navigate('/astrologers');
            }
        } catch (error) {
            console.error("Failed to fetch", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const response = await api.post('/admin/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = response.data.url;
            if (url.startsWith('http')) {
                setFormData(prev => ({ ...prev, profile_picture_url: url }));
            } else {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const fullUrl = `${apiUrl}${url}`;
                setFormData(prev => ({ ...prev, profile_picture_url: fullUrl }));
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.full_name) newErrors.full_name = "Full Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.phone_number) newErrors.phone_number = "Phone is required";

        if (!isEditMode && !formData.password) newErrors.password = "Password is required";

        if (formData.experience_years < 0) newErrors.experience_years = "Cannot be negative";
        if (formData.consultation_fee_per_min < 0) newErrors.consultation_fee_per_min = "Cannot be negative";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            if (isEditMode) {
                await api.put(`/admin/astrologers/${id}`, formData);
            } else {
                await api.post('/admin/astrologers', formData);
            }
            navigate('/astrologers');
        } catch (error) {
            console.error("Save failed", error);
            const msg = error.response?.data?.detail || "Operation failed";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formData.email) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 w-full mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" className="p-2" onClick={() => navigate('/astrologers')}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? 'Edit Astrologer' : 'Add New Astrologer'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isEditMode ? 'Update astrologer profile and details' : 'Onboard a new astrologer to the platform'}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                            Basic Information
                        </h3>
                    </div>

                    <Input
                        label="Full Name" name="full_name"
                        value={formData.full_name} onChange={handleChange}
                        error={errors.full_name}
                    />
                    <Input
                        label="Email Address" name="email"
                        value={formData.email} onChange={handleChange}
                        error={errors.email}
                    />
                    <Input
                        label="Phone Number" name="phone_number"
                        value={formData.phone_number} onChange={handleChange}
                        error={errors.phone_number}
                    />

                    {!isEditMode && (
                        <Input
                            label="Password" name="password" type="password"
                            value={formData.password} onChange={handleChange}
                            error={errors.password}
                        />
                    )}

                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                            Profile Details
                        </h3>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700">Profile Picture</span>
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {formData.profile_picture_url ? (
                                        <img src={formData.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                                            <span className="text-xs">No image</span>
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-medium">
                                            Uploading...
                                        </div>
                                    )}
                                </div>
                                <label className="mt-3 block">
                                    <span className="sr-only">Choose profile photo</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-xs file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100 cursor-pointer"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 w-full">
                            <Input
                                className="md:col-span-2"
                                label="Short Bio (Title)" name="short_bio"
                                value={formData.short_bio} onChange={handleChange}
                                placeholder="e.g. Vedic Expert"
                            />
                            <Input
                                label="Experience (Years)" name="experience_years" type="number"
                                value={formData.experience_years} onChange={handleChange}
                                error={errors.experience_years}
                            />
                            <Input
                                label="Consultation Fee (₹/min)" name="consultation_fee_per_min" type="number"
                                value={formData.consultation_fee_per_min} onChange={handleChange}
                                error={errors.consultation_fee_per_min}
                            />
                            <Input
                                label="Languages" name="languages"
                                value={formData.languages} onChange={handleChange}
                                placeholder="English, Hindi, etc."
                            />
                            <Input
                                label="Specialties" name="specialties"
                                value={formData.specialties} onChange={handleChange}
                                placeholder="Vedic, Tarot, Numerology"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <Input
                            label="Availability Hours" name="availability_hours"
                            value={formData.availability_hours} onChange={handleChange}
                            placeholder="e.g. Mon-Fri 10am-6pm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <TextArea
                            label="About Me (Detailed)" name="about_me" rows={5}
                            value={formData.about_me} onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => navigate('/astrologers')}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || uploading} className="gap-2 min-w-[120px]">
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Details'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
