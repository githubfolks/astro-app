import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { isNative, isMobileViewport, useIsMobileViewport, getPlatform } from './utils/platform';
import { storage } from './utils/storage';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { MobileNavBar } from './components/MobileNavBar';
import ScrollToTop from './components/ScrollToTop';
import Analytics from './components/Analytics';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const MobileHome = lazy(() => import('./pages/MobileHome'));
const AstrologerHome = lazy(() => import('./pages/AstrologerHome'));
const HomeRoute: React.FC = () => {
    const { user } = useAuth();
    const isMobile = useIsMobileViewport();
    if (user?.role === 'ASTROLOGER') return <AstrologerHome />;
    return (isNative() || isMobile) ? <MobileHome /> : <Home />;
};
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP').then(module => ({ default: module.VerifyOTP })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then(module => ({ default: module.VerifyEmail })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const ChatHistoryPage = lazy(() => import('./pages/ChatHistoryPage'));
const TransactionHistoryPage = lazy(() => import('./pages/TransactionHistoryPage'));
const Chat = lazy(() => import('./pages/Chat').then(module => ({ default: module.Chat })));
const AstrologersPage = lazy(() => import('./pages/AstrologersPage'));
const CityAstrologers = lazy(() => import('./pages/CityAstrologers'));
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
const AstrologerBenefits = lazy(() => import('./pages/AstrologerBenefits'));
const KundliGenerator = lazy(() => import('./pages/KundliGenerator'));
const KundliMatchGenerator = lazy(() => import('./pages/KundliMatchGenerator'));
const LiveMuhurat = lazy(() => import('./pages/LiveMuhurat'));
const Panchang = lazy(() => import('./pages/Panchang'));
const Classroom = lazy(() => import('./pages/Classroom').then(module => ({ default: module.Classroom })));
const CourseManager = lazy(() => import('./pages/CourseManager').then(module => ({ default: module.CourseManager })));
const MemoryGuruAbout = lazy(() => import('./pages/MemoryGuruAbout'));
const Book = lazy(() => import('./pages/Book'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Pricing = lazy(() => import('./pages/Pricing'));
const HoroscopeSign = lazy(() => import('./pages/horoscope/HoroscopeSign'));
const YearlyHoroscopeSign = lazy(() => import('./pages/horoscope/YearlyHoroscopeSign'));
const YearlyHoroscopeListing = lazy(() => import('./pages/horoscope/YearlyHoroscopeListing'));
const AiAstrologer = lazy(() => import('./pages/AiAstrologer'));
const HoroscopeListing = lazy(() => import('./pages/horoscope/HoroscopeListing'));
const ManglikChecker = lazy(() => import('./pages/tools/ManglikChecker'));
const NavamsaViewer = lazy(() => import('./pages/tools/NavamsaViewer'));
const KundliChartViewer = lazy(() => import('./pages/tools/KundliChartViewer'));
const KundliMatchChecker = lazy(() => import('./pages/tools/KundliMatchChecker'));
const NumerologyCalculator = lazy(() => import('./pages/tools/NumerologyCalculator'));
const ReportViewer = lazy(() => import('./pages/reports/ReportViewer'));

// Service Pages
const KundliMatching = lazy(() => import('./pages/services/KundliMatching'));
const LoveAdvice = lazy(() => import('./pages/services/LoveAdvice'));
const DailyHoroscope = lazy(() => import('./pages/services/DailyHoroscope'));
const VedicAstrology = lazy(() => import('./pages/services/VedicAstrology'));
const AadikartaVsAstroTalk = lazy(() => import('./pages/compare/AadikartaVsAstroTalk'));
const AadikartaVsAstroSage = lazy(() => import('./pages/compare/AadikartaVsAstroSage'));
const AadikartaVsAstroyogi = lazy(() => import('./pages/compare/AadikartaVsAstroyogi'));
const AadikartaVsAnytimeAstro = lazy(() => import('./pages/compare/AadikartaVsAnytimeAstro'));
const TarotReading = lazy(() => import('./pages/services/TarotReading'));
const VastuShastra = lazy(() => import('./pages/services/VastuShastra'));
const InstantReports = lazy(() => import('./pages/services/InstantReports'));

// Redirect /astrologer/:id → /astrologers/:id preserving the param
const AstrologerRedirect: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={`/astrologers/${id}`} replace />;
};

// Redirect /horoscope/:sign → /services/horoscope/:sign preserving the param
const HoroscopeSignRedirect: React.FC = () => {
    const { sign } = useParams<{ sign: string }>();
    return <Navigate to={`/services/horoscope/${sign}`} replace />;
};

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

// Toggles the compact-mobile-UI body class for the native shell AND narrow browser
// viewports, so mobile web gets the same fonts/spacing as the native app.
const AppModeClass: React.FC = () => {
    useEffect(() => {
        const update = () => {
            document.body.classList.toggle('native-app', isNative() || isMobileViewport());
        };
        update();

        const mql = window.matchMedia('(max-width: 767px)');
        mql.addEventListener('change', update);
        return () => mql.removeEventListener('change', update);
    }, []);

    return null;
};

// Native initialization & back button handling
const NativeInitializer: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {

        if (!isNative()) return;

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

        // Tapping a "knock" ring push (or a new consultation request) should take the astrologer straight to their queue
        let pushHandler: Promise<{ remove: () => void }> | undefined;
        import('@capacitor/push-notifications').then(({ PushNotifications }) => {
            pushHandler = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                if (action.notification.data?.type === 'KNOCK' || action.notification.data?.type === 'NEW_REQUEST') {
                    navigate('/dashboard');
                    // If the Dashboard is already mounted (app was in the foreground on
                    // that route), navigate() alone won't remount it or refetch data.
                    window.dispatchEvent(new Event('dashboard:refresh'));
                }
            });
        }).catch(() => { });

        return () => {
            backHandler.then(h => h.remove());
            pushHandler?.then(h => h.remove());
        };
    }, [navigate]);

    return null;
};

// Shows a one-time onboarding carousel on native before the first launch's routes render
const OnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<'checking' | 'show' | 'done'>(isNative() ? 'checking' : 'done');

    useEffect(() => {
        if (!isNative()) return;
        storage.getItem('onboarding_complete').then((value) => {
            setStatus(value === 'true' ? 'done' : 'show');
        });
    }, []);

    if (status === 'checking') {
        return <div style={{ position: 'fixed', inset: 0, background: '#FFF9F0' }} />;
    }
    if (status === 'show') {
        return (
            <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#FFF9F0' }} />}>
                <Onboarding onComplete={() => setStatus('done')} />
            </Suspense>
        );
    }
    return <>{children}</>;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <RealtimeProvider>
                    <ScrollToTop />
                    <Analytics />
                    <AppModeClass />
                    <NativeInitializer />
                    <OnboardingGate>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<HomeRoute />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/verify-otp" element={<VerifyOTP />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/ai-astrologer" element={<AiAstrologer />} />
                            <Route path="/astrologers" element={<AstrologersPage />} />
                            <Route path="/astrologers/city/:cityName" element={<CityAstrologers />} />
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
                            <Route path="/astrologer-benefits" element={<AstrologerBenefits />} />
                            <Route path="/how-it-works" element={<HowItWorks />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/services/horoscope" element={<HoroscopeListing />} />
                            <Route path="/services/horoscope/yearly" element={<YearlyHoroscopeListing />} />
                            <Route path="/services/horoscope/yearly/:sign" element={<YearlyHoroscopeSign />} />
                            <Route path="/services/horoscope/:sign" element={<HoroscopeSign />} />
                            <Route path="/horoscope" element={<Navigate to="/services/horoscope" replace />} />
                            <Route path="/horoscope/:sign" element={<HoroscopeSignRedirect />} />
                            <Route path="/blog" element={<Blog />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />

                            {/* Service Pages */}
                            <Route path="/services/kundli-matching" element={<KundliMatching />} />
                            <Route path="/services/love-advice" element={<LoveAdvice />} />
                            <Route path="/services/daily-horoscope" element={<DailyHoroscope />} />
                            <Route path="/services/vedic-astrology" element={<VedicAstrology />} />
                            <Route path="/services/tarot-reading" element={<TarotReading />} />
                            <Route path="/services/vastu-shastra" element={<VastuShastra />} />
                            <Route path="/services/ai-instant-reports" element={<InstantReports />} />
                            <Route path="/vs/astrotalk" element={<AadikartaVsAstroTalk />} />
                            <Route path="/vs/astrosage" element={<AadikartaVsAstroSage />} />
                            <Route path="/compare/aadikarta-vs-astrosage" element={<AadikartaVsAstroSage />} />
                            <Route path="/vs/astroyogi" element={<AadikartaVsAstroyogi />} />
                            <Route path="/vs/anytimeastro" element={<AadikartaVsAnytimeAstro />} />
                            <Route path="/memory-guru" element={<MemoryGuruAbout />} />
                            <Route path="/book" element={<Book />} />
                            <Route path="/panchang" element={<Panchang />} />
                            <Route path="/tools/manglik-dosha-checker" element={<ManglikChecker />} />
                            <Route path="/tools/navamsa-chart" element={<NavamsaViewer />} />
                            <Route path="/tools/kundli-chart" element={<KundliChartViewer />} />
                            <Route path="/tools/kundli-matching" element={<KundliMatchChecker />} />
                            <Route path="/tools/numerology-calculator" element={<NumerologyCalculator />} />
                            <Route path="/reports/:orderId" element={<ReportViewer />} />

                            {/* Dynamic Page Route - Must be last to avoid catching specific routes */}
                            <Route path="/:slug" element={<PageViewer />} />
                            <Route path="/dashboard" element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="/chat-history" element={
                                <ProtectedRoute>
                                    <ChatHistoryPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/transaction-history" element={
                                <ProtectedRoute>
                                    <TransactionHistoryPage />
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
                            <Route path="/kundli/matching" element={
                                <ProtectedRoute>
                                    <KundliMatchGenerator />
                                </ProtectedRoute>
                            } />
                            <Route path="/muhurat" element={
                                <ProtectedRoute>
                                    <LiveMuhurat />
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
                    </OnboardingGate>
                </RealtimeProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
