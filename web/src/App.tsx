import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { isNative, getPlatform } from './utils/platform';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { MobileNavBar } from './components/MobileNavBar';
import ScrollToTop from './components/ScrollToTop';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP').then(module => ({ default: module.VerifyOTP })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Chat = lazy(() => import('./pages/Chat').then(module => ({ default: module.Chat })));
const AstrologersPage = lazy(() => import('./pages/AstrologersPage'));
const AstrologerProfile = lazy(() => import('./pages/AstrologerProfile'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const PageViewer = lazy(() => import('./pages/PageViewer'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const JoinAsAstrologer = lazy(() => import('./pages/JoinAsAstrologer').then(module => ({ default: module.JoinAsAstrologer })));
const KundliGenerator = lazy(() => import('./pages/KundliGenerator'));
const Classroom = lazy(() => import('./pages/Classroom').then(module => ({ default: module.Classroom })));
const CourseManager = lazy(() => import('./pages/CourseManager').then(module => ({ default: module.CourseManager })));
const MemoryGuruAbout = lazy(() => import('./pages/MemoryGuruAbout'));

// Service Pages
const KundliMatching = lazy(() => import('./pages/services/KundliMatching'));
const LoveAdvice = lazy(() => import('./pages/services/LoveAdvice'));
const DailyHoroscope = lazy(() => import('./pages/services/DailyHoroscope'));
const VedicAstrology = lazy(() => import('./pages/services/VedicAstrology'));
const TarotReading = lazy(() => import('./pages/services/TarotReading'));
const VastuShastra = lazy(() => import('./pages/services/VastuShastra'));

// Loading component
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
);

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className="auth-loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }
    if (!isAuthenticated) return <Navigate to="/login" />;
    return <React.Fragment>{children}</React.Fragment>;
};

// Native initialization & back button handling
const NativeInitializer: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {

        if (!isNative()) return;

        // Add native-app class to body
        document.body.classList.add('native-app');

        // Configure status bar
        StatusBar.setStyle({ style: Style.Light }).catch(() => { });
        if (getPlatform() === 'android') {
            StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => { });
        }

        // Hide splash screen after app is ready
        SplashScreen.hide().catch(() => { });

        // Hardware back button handler
        const backHandler = CapApp.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                navigate(-1);
            } else {
                CapApp.exitApp();
            }
        });

        return () => {
            backHandler.then(h => h.remove());
        };
    }, [navigate]);

    return null;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <ScrollToTop />
                <NativeInitializer />
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/verify-otp" element={<VerifyOTP />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/chat-with-astrologers" element={<AstrologersPage />} />
                        <Route path="/astrologer/:id" element={<AstrologerProfile />} />
                        <Route path="/about-us" element={<AboutUs />} />
                        <Route path="/contact-us" element={<ContactUs />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/refund-policy" element={<RefundPolicy />} />
                        <Route path="/disclaimer" element={<Disclaimer />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/join-as-astrologer" element={<JoinAsAstrologer />} />
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
