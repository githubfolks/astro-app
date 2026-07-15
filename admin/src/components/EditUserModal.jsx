import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { cms } from '../services/api';

export const EditUserModal = ({ isOpen, onClose, user, profile, onSuccess }) => {
    const [phone, setPhone] = useState('');
    const [fullName, setFullName] = useState('');
    // Seeker-specific fields
    const [dob, setDob] = useState('');
    const [tob, setTob] = useState('');
    const [pob, setPob] = useState('');
    const [gender, setGender] = useState('');
    // Astrologer-specific fields
    const [experience, setExperience] = useState('');
    const [languages, setLanguages] = useState('');
    const [specialties, setSpecialties] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            setError('');
            setPhone(user.phone_number || '');
            setFullName(profile?.full_name || '');
            setDob(profile?.date_of_birth || '');
            
            // Format time_of_birth HH:MM:SS to HH:MM for time input
            const rawTob = profile?.time_of_birth || '';
            setTob(rawTob.substring(0, 5));
            
            setPob(profile?.place_of_birth || '');
            setGender(profile?.gender || '');
            setExperience(profile?.experience_years || '');
            setLanguages(profile?.languages || '');
            setSpecialties(profile?.specialties || '');
        }
    }, [isOpen, user, profile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            phone_number: phone || null,
            full_name: fullName || null,
        };

        if (user.role === 'SEEKER') {
            payload.date_of_birth = dob || null;
            payload.time_of_birth = tob || null;
            payload.place_of_birth = pob || null;
            payload.gender = gender || null;
        } else if (user.role === 'ASTROLOGER') {
            payload.experience_years = experience ? parseInt(experience, 10) : null;
            payload.languages = languages || null;
            payload.specialties = specialties || null;
        }

        try {
            await cms.users.editDetails(user.id, payload);
            alert('User details updated successfully.');
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Update failed', err);
            setError(err.message || 'Failed to update user details.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit User Details">
            <div className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Read-Only Email Field */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium leading-none text-gray-900">
                            Email Address (Read-only)
                        </label>
                        <input
                            type="email"
                            value={user.email || ''}
                            disabled
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed focus:outline-none"
                        />
                    </div>

                    <Input
                        label="Phone Number"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 919899753028"
                        disabled={loading}
                        fullWidth
                    />

                    {/* Common Full Name Field */}
                    <Input
                        label="Full Name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Shiv Sharma"
                        disabled={loading}
                        fullWidth
                    />

                    {/* Seeker Profile Fields */}
                    {user.role === 'SEEKER' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Date of Birth"
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    disabled={loading}
                                    fullWidth
                                />
                                <Input
                                    label="Time of Birth"
                                    type="time"
                                    value={tob}
                                    onChange={(e) => setTob(e.target.value)}
                                    disabled={loading}
                                    fullWidth
                                />
                            </div>

                            <Input
                                label="Place of Birth"
                                type="text"
                                value={pob}
                                onChange={(e) => setPob(e.target.value)}
                                placeholder="e.g. New Delhi, India"
                                disabled={loading}
                                fullWidth
                            />

                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-sm font-medium leading-none">
                                    Gender
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    disabled={loading}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Astrologer Profile Fields */}
                    {user.role === 'ASTROLOGER' && (
                        <>
                            <Input
                                label="Experience (Years)"
                                type="number"
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                placeholder="e.g. 5"
                                disabled={loading}
                                fullWidth
                            />

                            <Input
                                label="Languages"
                                type="text"
                                value={languages}
                                onChange={(e) => setLanguages(e.target.value)}
                                placeholder="e.g. English, Hindi"
                                disabled={loading}
                                fullWidth
                            />

                            <Input
                                label="Specialties"
                                type="text"
                                value={specialties}
                                onChange={(e) => setSpecialties(e.target.value)}
                                placeholder="e.g. Vedic, Tarot"
                                disabled={loading}
                                fullWidth
                            />
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outlined"
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
