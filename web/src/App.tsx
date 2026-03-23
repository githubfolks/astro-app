import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { isNative, getPlatform } from './utils/platform';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import ScrollToTop from './components/ScrollToTop';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));


// Loading component
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
);


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
            <ScrollToTop />
            <NativeInitializer />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
