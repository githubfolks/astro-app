import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Check, User, GraduationCap, FileText, Camera, ShieldCheck } from 'lucide-react';
import './Auth.css';

export const JoinAsAstrologer: React.FC = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>({
        full_name: '',
        email: '',
        phone_number: '',
        password: '',
        astrology_types: [],
        experience_years: '',
        languages: '',
        preferred_working_hours: '',
        city: '',
        short_bio: '',
        profile_photo_url: '',
        id_proof_url: '',
        legal_agreement_accepted: false
    });
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const astrologyOptions = ['Vedic', 'Lal Kitab', 'Numerology', 'Tarot Reader', 'Vastu', 'Palmistry', 'Western Astrology'];

    const handleAstrologyTypeChange = (type: string) => {
        const types = [...formData.astrology_types];
        if (types.includes(type)) {
            setFormData({ ...formData, astrology_types: types.filter(t => t !== type) });
        } else {
            setFormData({ ...formData, astrology_types: [...types, type] });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        try {
            const result = await api.astrologers.uploadFile(file);
            setFormData({ ...formData, [field]: result.url });
        } catch (err: any) {
            setError('File upload failed');
        } finally {
            setIsLoading(false);
        }
    };

    const sendOtp = async () => {
        if (!formData.phone_number) {
            setError('Please enter mobile number first');
            return;
        }
        setIsLoading(true);
        try {
            await api.astrologers.sendOtp(formData.phone_number);
            setOtpSent(true);
            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = () => {
        // In a real app, call verifyOtp API. Here we just advance if OTP is 123456
        if (otp === '123456' || otp === '') { // Allow empty for demo/sim
            setStep(2);
            setError('');
        } else {
            setError('Invalid OTP');
        }
    };

    const handleSubmit = async () => {
        if (!formData.legal_agreement_accepted) {
            setError('Please accept the legal agreement');
            return;
        }
        setIsLoading(true);
        try {
            await api.astrologers.onboarding(formData);
            setStep(4); // Success step
        } catch (err: any) {
            setError(err.message || 'Onboarding failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ minHeight: '100vh', padding: '40px 20px' }}>
            <div className="decor-circle decor-1"></div>
            <div className="decor-circle decor-2"></div>

            <div className="auth-card onboarding-card" style={{ maxWidth: '800px', width: '100%' }}>
                <div className="auth-header">
                    <h2 className="auth-title">Join as Astrologer</h2>
                    <p className="auth-subtitle">Become a verified partner at Aadikarta</p>

                    <div className="step-indicator">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                {step === 1 && (
                    <div className="onboarding-step">
                        <h3 className="step-title"><User size={20} /> Identity Verification</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="John Doe" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <div className="input-with-button">
                                    <input type="text" placeholder="+91 00000 00000" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} disabled={otpSent} />
                                    {!otpSent ? <button onClick={sendOtp} disabled={isLoading}>Send OTP</button> : <span className="verified-badge"><Check size={16} /> Sent</span>}
                                </div>
                            </div>
                            {otpSent && (
                                <div className="form-group full-width">
                                    <label>Enter OTP</label>
                                    <input type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} />
                                </div>
                            )}
                        </div>
                        <button className="auth-btn next-btn" onClick={verifyOtp} disabled={isLoading}>{otpSent ? 'Verify & Next' : 'Next'}</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-step">
                        <h3 className="step-title"><GraduationCap size={20} /> Professional Details</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Astrology Type</label>
                                <div className="checkbox-grid">
                                    {astrologyOptions.map(type => (
                                        <label key={type} className="checkbox-item">
                                            <input type="checkbox" checked={formData.astrology_types.includes(type)} onChange={() => handleAstrologyTypeChange(type)} />
                                            <span>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Years of Experience</label>
                                <input type="number" placeholder="5" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Languages</label>
                                <input type="text" placeholder="Hindi, English, Marathi" value={formData.languages} onChange={e => setFormData({ ...formData, languages: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Preferred Working Hours</label>
                                <input type="text" placeholder="9 AM - 6 PM" value={formData.preferred_working_hours} onChange={e => setFormData({ ...formData, preferred_working_hours: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>City (Optional)</label>
                                <input type="text" placeholder="Mumbai" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                            <div className="form-group full-width">
                                <label>Short Bio</label>
                                <textarea placeholder="Tell us about yourself..." value={formData.short_bio} onChange={e => setFormData({ ...formData, short_bio: e.target.value })} rows={3}></textarea>
                            </div>
                        </div>
                        <div className="btn-row">
                            <button className="back-btn" onClick={() => setStep(1)}>Back</button>
                            <button className="auth-btn next-btn" onClick={() => setStep(3)}>Next</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="onboarding-step">
                        <h3 className="step-title"><Camera size={20} /> Documents & Agreement</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Profile Photo</label>
                                <div className="file-upload-box">
                                    <Camera size={24} />
                                    <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'profile_photo_url')} />
                                    {formData.profile_photo_url ? <span className="file-name">Uploaded!</span> : <span>Click to upload photo</span>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>ID Proof (Recommended)</label>
                                <div className="file-upload-box">
                                    <FileText size={24} />
                                    <input type="file" accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'id_proof_url')} />
                                    {formData.id_proof_url ? <span className="file-name">Uploaded!</span> : <span>Aadhar / PAN Card</span>}
                                </div>
                            </div>
                        </div>

                        <div className="legal-agreement">
                            <h4>Legal Agreement</h4>
                            <div className="agreement-content">
                                <p><strong>1. Commission Terms:</strong> 30% platform fee applies to all consultations.</p>
                                <p><strong>2. Payout Schedule:</strong> Weekly payouts on every Monday.</p>
                                <p><strong>3. Code of Conduct:</strong> Professional behavior is mandatory. No exchange of personal contact info.</p>
                                <p><strong>4. Termination Clause:</strong> Either party can terminate with 7 days notice.</p>
                            </div>
                            <label className="checkbox-item agreement-checkbox">
                                <input type="checkbox" checked={formData.legal_agreement_accepted} onChange={e => setFormData({ ...formData, legal_agreement_accepted: e.target.checked })} />
                                <span>I agree to the terms and conditions</span>
                            </label>
                        </div>

                        <div className="btn-row">
                            <button className="back-btn" onClick={() => setStep(2)}>Back</button>
                            <button className="auth-btn submit-btn" onClick={handleSubmit} disabled={isLoading}>Submit Application</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="success-step">
                        <div className="success-icon"><ShieldCheck size={64} /></div>
                        <h3>Application Submitted!</h3>
                        <p>Thank you for choosing Aadikarta. Your profile is now under review by our admin team. You will be notified via email once approved.</p>
                        <button className="auth-btn" onClick={() => navigate('/')}>Go to Home</button>
                    </div>
                )}
            </div>

            <style>{`
                .onboarding-card { padding: 40px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .step-indicator { display: flex; align-items: center; justify-content: center; margin-top: 30px; gap: 10px; }
                .step-dot { width: 30px; height: 30px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #666; transition: 0.3s; }
                .step-dot.active { background: var(--primary-color, #7c3aed); color: white; }
                .step-line { width: 50px; height: 2px; background: #eee; }
                .step-title { display: flex; align-items: center; gap: 10px; margin: 30px 0 20px; font-size: 20px; color: #1f2937; }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .full-width { grid-column: span 2; }
                .input-with-button { display: flex; gap: 10px; }
                .input-with-button button { padding: 0 15px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; }
                .verified-badge { display: flex; align-items: center; gap: 4px; color: #10b981; font-size: 14px; font-weight: 500; }
                .checkbox-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px; }
                .checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
                .file-upload-box { border: 2px dashed #e5e7eb; border-radius: 12px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; cursor: pointer; color: #9ca3af; transition: 0.3s; }
                .file-upload-box:hover { border-color: #7c3aed; color: #7c3aed; }
                .file-upload-box input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
                .file-name { color: #7c3aed; font-weight: 500; font-size: 12px; margin-top: 5px; }
                .legal-agreement { margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 12px; }
                .legal-agreement h4 { margin-bottom: 15px; font-size: 16px; color: #111827; }
                .agreement-content { height: 150px; overflow-y: auto; font-size: 13px; color: #4b5563; line-height: 1.6; padding-right: 10px; margin-bottom: 15px; }
                .agreement-checkbox { margin-top: 15px; }
                .btn-row { display: flex; gap: 15px; margin-top: 30px; }
                .back-btn { flex: 1; padding: 12px; background: #f3f4f6; border: none; border-radius: 10px; cursor: pointer; font-weight: 500; }
                .next-btn, .submit-btn { flex: 2; height: 48px; }
                .success-step { text-align: center; padding: 40px 0; }
                .success-icon { color: #10b981; margin-bottom: 20px; }
                .success-step h3 { font-size: 24px; color: #111827; margin-bottom: 15px; }
                .success-step p { color: #6b7280; margin-bottom: 30px; }
                @media (max-width: 640px) {
                    .form-grid { grid-template-columns: 1fr; }
                    .full-width { grid-column: span 1; }
                    .checkbox-grid { grid-template-columns: 1fr 1fr; }
                }
            `}</style>
        </div>
    );
};
