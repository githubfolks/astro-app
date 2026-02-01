import React, { useState, useEffect } from 'react';
import { cms } from '../services/api';
import { Check, X, Eye, User, FileText, Calendar, Languages, Award } from 'lucide-react';

const AstrologerApprovals = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAstro, setSelectedAstro] = useState(null);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const response = await cms.astrologers.listPending();
            setPending(response.data);
        } catch (err) {
            setError('Failed to fetch pending applications');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this astrologer?')) return;
        try {
            await cms.astrologers.approve(id);
            setPending(pending.filter(p => p.id !== id));
            setSelectedAstro(null);
        } catch (err) {
            alert('Approval failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading applications...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Astrologer Applications</h1>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {pending.length} Pending
                </span>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Astrologer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Experience</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pending.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-400">No pending applications</td>
                                </tr>
                            ) : (
                                pending.map((astro) => (
                                    <tr key={astro.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={astro.profile.profile_picture_url || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                                                <div>
                                                    <div className="font-medium text-gray-900">{astro.profile.full_name}</div>
                                                    <div className="text-xs text-gray-500">{astro.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {astro.profile.experience_years} Years
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedAstro(astro)}
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {selectedAstro ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Profile Details</h2>
                            <button onClick={() => setSelectedAstro(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <img src={selectedAstro.profile.profile_picture_url || 'https://via.placeholder.com/100'} alt="" className="w-24 h-24 rounded-xl object-cover ring-4 ring-purple-50" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{selectedAstro.profile.full_name}</h3>
                                    <p className="text-gray-500 text-sm mb-2">{selectedAstro.email} | {selectedAstro.phone_number}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAstro.profile.astrology_types?.map(type => (
                                            <span key={type} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{type}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Award size={12} /> Experience</div>
                                    <div className="font-medium text-sm">{selectedAstro.profile.experience_years} Years</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Languages size={12} /> Languages</div>
                                    <div className="font-medium text-sm">{selectedAstro.profile.languages}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={12} /> City</div>
                                    <div className="font-medium text-sm">{selectedAstro.profile.city || 'N/A'}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Agreement</div>
                                    <div className="font-medium text-sm text-green-600">{selectedAstro.profile.legal_agreement_accepted ? 'Accepted' : 'Pending'}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Short Bio</h4>
                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg italic">
                                    "{selectedAstro.profile.short_bio}"
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">ID Proof Document</h4>
                                {selectedAstro.profile.id_proof_url ? (
                                    <a
                                        href={selectedAstro.profile.id_proof_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-purple-600 hover:underline"
                                    >
                                        <FileText size={16} /> View Document
                                    </a>
                                ) : (
                                    <span className="text-sm text-gray-400">Not provided</span>
                                )}
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => handleApprove(selectedAstro.id)}
                                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> Approve Astrologer
                                </button>
                                <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-12 text-gray-400">
                        <User size={48} className="mb-4 opacity-20" />
                        <p>Select an application to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AstrologerApprovals;
