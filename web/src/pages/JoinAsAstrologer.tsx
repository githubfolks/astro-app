import { getErrorMessage } from '../utils/errors';
import { getPasswordError, PASSWORD_REQUIREMENTS } from '../utils/password';
import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { User, GraduationCap, Camera, ShieldCheck, ArrowLeft, Sparkles, Award, Globe2, Clock, MapPin, MessageSquareText } from 'lucide-react';
import './Auth.css';
import SEO from '../components/SEO';

const joinStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebPage',
            '@id': 'https://aadikarta.org/join-as-astrologer#page',
            name: 'Become an Astrologer on Aadikarta',
            url: 'https://aadikarta.org/join-as-astrologer',
            description: 'Apply to join Aadikarta as a verified astrologer, tarot reader, or numerologist. Set your own rates and earn from live chat consultations.',
            publisher: { '@id': 'https://aadikarta.org/#organization' },
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'Who can join Aadikarta as an astrologer?', acceptedAnswer: { '@type': 'Answer', text: 'Any verified Vedic astrologer, tarot card reader, numerologist, or Vastu consultant with genuine expertise can apply. You will go through a verification process before being listed on the platform.' } },
                { '@type': 'Question', name: 'How much can I earn as an astrologer on Aadikarta?', acceptedAnswer: { '@type': 'Answer', text: 'You set your own consultation rate (₹10–₹150 per minute). Your earnings depend on the number of consultations you complete and your hourly rate. Top astrologers on the platform earn over ₹1 lakh per month.' } },
                { '@type': 'Question', name: 'Is there a fee to join Aadikarta?', acceptedAnswer: { '@type': 'Answer', text: 'No, joining Aadikarta as an astrologer is completely free. Aadikarta takes a platform commission from your earnings only when you complete a paid consultation.' } },
                { '@type': 'Question', name: 'How long does the verification process take?', acceptedAnswer: { '@type': 'Answer', text: 'The verification process typically takes 2–3 business days after you submit your application and credentials.' } },
            ],
        },
    ],
};

interface AstrologerForm {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    astrology_types: string[];
    experience_years: string;
    languages: string;
    preferred_working_hours: string;
    city: string;
    short_bio: string;
    profile_photo_url: string;
    legal_agreement_accepted: boolean;
    // Allows dynamic field updates (e.g. file-upload result) by key.
    [key: string]: string | string[] | boolean;
}

export const JoinAsAstrologer: React.FC = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<AstrologerForm>({
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
        // No standalone agreement step anymore — terms are covered in the
        // onboarding contract signed later; the backend field defaults to
        // true when omitted, this just makes that explicit.
        legal_agreement_accepted: true
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const astrologyOptions = ['Vedic', 'Lal Kitab', 'Numerology', 'Tarot Reader', 'Vastu', 'Palmistry', 'Western Astrology'];
    const languageOptions = ['Hindi', 'English', 'Marathi', 'Gujarati', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Kannada'];

    const handleAstrologyTypeChange = (type: string) => {
        const types = [...formData.astrology_types];
        if (types.includes(type)) {
            setFormData({ ...formData, astrology_types: types.filter(t => t !== type) });
        } else {
            setFormData({ ...formData, astrology_types: [...types, type] });
        }
    };

    const selectedLanguages = formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(Boolean) : [];

    const handleLanguageChange = (lang: string) => {
        const languages = selectedLanguages.includes(lang)
            ? selectedLanguages.filter(l => l !== lang)
            : [...selectedLanguages, lang];
        setFormData({ ...formData, languages: languages.join(', ') });
    };

    const MAX_PHOTO_SIZE_MB = 5;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
            setError(`File too large — max ${MAX_PHOTO_SIZE_MB}MB`);
            e.target.value = '';
            return;
        }
        setIsLoading(true);
        try {
            const result = await api.astrologers.uploadFile(file);
            setFormData({ ...formData, [field]: result.url });
        } catch (err) {
            setError(getErrorMessage(err) || 'File upload failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextStep1 = () => {
        // Step 1 Validation
        if (!formData.full_name || !formData.email || !formData.password || !formData.phone_number) {
            setError('All fields in this step are mandatory');
            return;
        }

        // Email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        const passwordError = getPasswordError(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setStep(2);
        setError('');
    };

    const handleSubmit = async () => {
        // Step 2 Validation
        if (formData.astrology_types.length === 0) {
            setError('Please select at least one astrology type');
            return;
        }
        if (!formData.experience_years || !formData.languages || !formData.preferred_working_hours || !formData.short_bio) {
            setError('All professional details are mandatory');
            return;
        }
        if (!formData.profile_photo_url) {
            setError('Please upload your profile photo');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await api.astrologers.onboarding(formData);
            setStep(3); // Success step
        } catch (err) {
            setError(getErrorMessage(err) || 'Onboarding failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ minHeight: '100vh', padding: '40px 20px' }}>
            <Link to="/" className="back-to-home-link" style={{ position: 'absolute', top: '20px', left: '20px' }}>
                <ArrowLeft size={20} /> Back to Home
            </Link>
            <SEO
                title="Become an Astrologer on Aadikarta | Work Online & Earn from Home"
                description="Are you a Vedic astrologer, tarot reader, or numerologist? Join Aadikarta to connect with thousands of seekers, set your own consultation rates, and earn from live chat sessions. Apply now."
                structuredData={joinStructuredData}
            />
            <div className="decor-circle decor-1"></div>
            <div className="decor-circle decor-2"></div>

            <main className="auth-card onboarding-card" style={{ maxWidth: '800px', width: '100%' }}>
                <div className="auth-header">
                    <h1 className="auth-title">Join as Astrologer</h1>
                    <p className="auth-subtitle">Become a verified partner at Aadikarta</p>

                    <div className="step-indicator">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                    </div>
                </div>

                {error && <div className="error-banner">{error}</div>}

                {step === 1 && (
                    <div className="onboarding-step auth-form">
                        <h3 className="step-title"><User size={20} /> Account Details</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="Shiv Sharma" autoComplete="off" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" placeholder="shiv@example.com" autoComplete="off" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" placeholder="••••••••" autoComplete="new-password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                <p className="field-hint">{PASSWORD_REQUIREMENTS}</p>
                            </div>
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input type="text" placeholder="+91 00000 00000" autoComplete="off" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                                <p className="field-hint">We'll use this to reach you during onboarding — keep it active on WhatsApp.</p>
                            </div>
                        </div>
                        <button className="auth-btn next-btn" onClick={handleNextStep1} disabled={isLoading}>Next</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-step auth-form">
                        <h3 className="step-title"><GraduationCap size={20} /> Professional Details</h3>

                        <div className="pro-section">
                            <label className="section-label"><Sparkles size={15} /> Areas of Expertise</label>
                            <div className="chip-grid">
                                {astrologyOptions.map(type => {
                                    const selected = formData.astrology_types.includes(type);
                                    return (
                                        <button
                                            type="button"
                                            key={type}
                                            className={`chip ${selected ? 'chip-selected' : ''}`}
                                            onClick={() => handleAstrologyTypeChange(type)}
                                        >
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pro-section">
                            <label className="section-label"><Globe2 size={15} /> Languages Spoken</label>
                            <div className="chip-grid">
                                {languageOptions.map(lang => {
                                    const selected = selectedLanguages.includes(lang);
                                    return (
                                        <button
                                            type="button"
                                            key={lang}
                                            className={`chip ${selected ? 'chip-selected' : ''}`}
                                            onClick={() => handleLanguageChange(lang)}
                                        >
                                            {lang}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pro-section">
                            <label className="section-label"><Award size={15} /> Experience &amp; Availability</label>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label><Award size={14} /> Years of Experience</label>
                                    <input type="number" placeholder="5" value={formData.experience_years} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label><Clock size={14} /> Preferred Working Hours</label>
                                    <input type="text" placeholder="9 AM - 6 PM" value={formData.preferred_working_hours} onChange={e => setFormData({ ...formData, preferred_working_hours: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label><MapPin size={14} /> City</label>
                                    <input type="text" placeholder="Mumbai" autoComplete="address-level2" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="pro-section">
                            <label className="section-label"><MessageSquareText size={15} /> About You</label>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Short Bio</label>
                                    <textarea placeholder="Tell us about yourself..." value={formData.short_bio} onChange={e => setFormData({ ...formData, short_bio: e.target.value })} rows={3}></textarea>
                                    <p className="field-hint">This is what seekers see first on your profile card — a couple of sentences is enough.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pro-section">
                            <label className="section-label"><Camera size={15} /> Profile Photo (Max {MAX_PHOTO_SIZE_MB}MB)</label>
                            <div className="form-grid">
                                <div className="form-group">
                                    <div className="file-upload-box">
                                        <Camera size={24} />
                                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'profile_photo_url')} />
                                        {formData.profile_photo_url ? <span className="file-name">Uploaded!</span> : <span>Click to upload photo</span>}
                                    </div>
                                    <p className="field-hint">JPG, PNG, WEBP or HEIC — max {MAX_PHOTO_SIZE_MB}MB. A clear, front-facing photo helps seekers recognize you.</p>
                                </div>
                            </div>
                        </div>

                        <div className="btn-row">
                            <button className="back-btn" onClick={() => setStep(1)}>Back</button>
                            <button className="auth-btn submit-btn" onClick={handleSubmit} disabled={isLoading}>Submit Application</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="success-step">
                        <div className="success-icon"><ShieldCheck size={64} /></div>
                        <h3>Application Submitted!</h3>
                        <p>Thank you for choosing Aadikarta. Your profile is now under review by our admin team. You will be notified via email once approved.</p>
                        <button className="auth-btn" onClick={() => navigate('/')}>Go to Home</button>
                    </div>
                )}
            </main>

            <style>{`
                .onboarding-card { padding: 40px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .step-indicator { display: flex; align-items: center; justify-content: center; margin-top: 30px; gap: 10px; }
                .step-dot { width: 30px; height: 30px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #666; transition: 0.3s; }
                .step-dot.active { background: var(--primary-color, #7c3aed); color: white; }
                .step-line { width: 50px; height: 2px; background: #eee; }
                .step-title { display: flex; align-items: center; gap: 10px; margin: 30px 0 20px; font-size: 20px; color: #1f2937; }
                .pro-section { margin-bottom: 28px; }
                .pro-section:last-of-type { margin-bottom: 0; }
                .section-label { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 12px; }
                .form-group label { display: flex; align-items: center; gap: 6px; }
                .chip-grid { display: flex; flex-wrap: wrap; gap: 10px; }
                .chip { padding: 9px 18px; border-radius: 999px; border: 1.5px solid #e5e7eb; background: #fff; color: #4b5563; font-size: 14px; font-weight: 500; cursor: pointer; transition: 0.2s; }
                .chip:hover { border-color: #c4b5fd; color: #7c3aed; }
                .chip-selected { background: #7c3aed; border-color: #7c3aed; color: #fff; }
                .chip-selected:hover { color: #fff; }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .full-width { grid-column: span 2; }
                .onboarding-step textarea { width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 15px; font-family: inherit; background-color: #fcfcfc; resize: vertical; transition: border-color 0.3s; }
                .onboarding-step textarea:focus { outline: none; border-color: var(--primary); background-color: white; }
                .file-upload-box { border: 2px dashed #e5e7eb; border-radius: 12px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; cursor: pointer; color: #9ca3af; transition: 0.3s; }
                .file-upload-box:hover { border-color: #7c3aed; color: #7c3aed; }
                .file-upload-box input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
                .file-name { color: #7c3aed; font-weight: 500; font-size: 12px; margin-top: 5px; }
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
                }
            `}</style>
        </div >
    );
};
