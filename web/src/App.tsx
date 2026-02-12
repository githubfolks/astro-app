import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import Home from './pages/Home';
import AstrologersPage from './pages/AstrologersPage';
import AstrologerProfile from './pages/AstrologerProfile';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import PageViewer from './pages/PageViewer';
import { MobileNavBar } from './components/MobileNavBar';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyOTP } from './pages/VerifyOTP';
import { ResetPassword } from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import Disclaimer from './pages/Disclaimer';
import TermsOfService from './pages/TermsOfService';
import { JoinAsAstrologer } from './pages/JoinAsAstrologer';
import KundliGenerator from './pages/KundliGenerator';

import { isNative, getPlatform } from './utils/platform';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

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
                <NativeInitializer />
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
                </Routes>
                <MobileNavBar />
            </AuthProvider>
        </Router>
    );
}

export default App;
