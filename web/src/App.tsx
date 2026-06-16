import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { isNative, getPlatform } from './utils/platform';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { MobileNavBar } from './components/MobileNavBar';
import ScrollToTop from './components/ScrollToTop';

// Lazy load pages
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Pricing = lazy(() => import('./pages/Pricing'));
const HoroscopeSign = lazy(() => import('./pages/horoscope/HoroscopeSign'));

// Service Pages
const KundliMatching = lazy(() => import('./pages/services/KundliMatching'));
const LoveAdvice = lazy(() => import('./pages/services/LoveAdvice'));
const DailyHoroscope = lazy(() => import('./pages/services/DailyHoroscope'));
const VedicAstrology = lazy(() => import('./pages/services/VedicAstrology'));
const TarotReading = lazy(() => import('./pages/services/TarotReading'));
const VastuShastra = lazy(() => import('./pages/services/VastuShastra'));

// Redirect /astrologer/:id → /astrologers/:id preserving the param
const AstrologerRedirect: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={`/astrologers/${id}`} replace />;
};

// Loading component
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
);

function App() {
    return (
        <Router>
            <AuthProvider>
                <ScrollToTop />
                <NativeInitializer />
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={isMainDomain ? <ComingSoon /> : <Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/verify-otp" element={<VerifyOTP />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/astrologers" element={<AstrologersPage />} />
                        <Route path="/chat-with-astrologers" element={<Navigate to="/astrologers" replace />} />
                        <Route path="/astrologers/:id" element={<AstrologerProfile />} />
                        <Route path="/astrologer/:id" element={<AstrologerRedirect />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        <Route path="/contact-us" element={<ContactUs />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/refund-policy" element={<RefundPolicy />} />
                        <Route path="/disclaimer" element={<Disclaimer />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/join-as-astrologer" element={<JoinAsAstrologer />} />
                        <Route path="/how-it-works" element={<HowItWorks />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/horoscope/:sign" element={<HoroscopeSign />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogPost />} />

                        {/* Service Pages */}
                        <Route path="/services/kundli-matching" element={<KundliMatching />} />
                        <Route path="/services/love-advice" element={<LoveAdvice />} />
                        <Route path="/services/daily-horoscope" element={<DailyHoroscope />} />
                        <Route path="/services/vedic-astrology" element={<VedicAstrology />} />
                        <Route path="/services/tarot-reading" element={<TarotReading />} />
                        <Route path="/services/vastu-shastra" element={<VastuShastra />} />
                        <Route path="/memory-guru" element={<MemoryGuruAbout />} />
                        <Route path="/book" element={<Book />} />

                        {/* Dynamic Page Route - Must be last to avoid catching specific routes */}
                        <Route path="/:slug" element={<PageViewer />} />
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/chat/:consultationId" element={
                            <ProtectedRoute>
                                <Chat />
                            </ProtectedRoute>
                        } />
                        <Route path="/chat/new/:astrologerId" element={
                            <ProtectedRoute>
                                <Chat />
                            </ProtectedRoute>
                        } />
                        <Route path="/kundli" element={
                            <ProtectedRoute>
                                <KundliGenerator />
                            </ProtectedRoute>
                        } />
                        <Route path="/classroom/:sessionId" element={
                            <ProtectedRoute>
                                <Classroom />
                            </ProtectedRoute>
                        } />
                        <Route path="/tutor/courses" element={
                            <ProtectedRoute>
                                <CourseManager />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </Suspense>
                <MobileNavBar />
            </AuthProvider>
        </Router>
    );
}

export default App;
