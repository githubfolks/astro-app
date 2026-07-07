import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layout/DashboardLayout';
import Login from './pages/Login';

// Route-level code splitting: heavy pages (recharts dashboard, quill editors)
// load on demand instead of shipping in the initial bundle.
const Users = lazy(() => import('./pages/Users'));
const Astrologers = lazy(() => import('./pages/Astrologers'));
const AstrologerForm = lazy(() => import('./pages/AstrologerForm'));
const AstrologerDetails = lazy(() => import('./pages/AstrologerDetails'));
const UserDetails = lazy(() => import('./pages/UserDetails'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Payouts = lazy(() => import('./pages/Payouts'));
const AstrologerOnboarding = lazy(() => import('./pages/AstrologerOnboarding'));
const PostList = lazy(() => import('./pages/cms/PostList'));
const PostEditor = lazy(() => import('./pages/cms/PostEditor'));
const PageList = lazy(() => import('./pages/cms/PageList'));
const PageEditor = lazy(() => import('./pages/cms/PageEditor'));
const HoroscopeList = lazy(() => import('./pages/cms/HoroscopeList'));
const HoroscopeEditor = lazy(() => import('./pages/cms/HoroscopeEditor'));
const ContactInquiries = lazy(() => import('./pages/cms/ContactInquiries'));
const EduReports = lazy(() => import('./pages/EduReports'));
const Disputes = lazy(() => import('./pages/Disputes'));
const Settings = lazy(() => import('./pages/Settings'));
const ModerationFlags = lazy(() => import('./pages/ModerationFlags'));

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or spinner

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/view/:id" element={<UserDetails />} />
            <Route path="/astrologers" element={<Astrologers />} />
            <Route path="/astrologer-onboarding" element={<AstrologerOnboarding />} />
            <Route path="/astrologer-approvals" element={<AstrologerOnboarding />} />
            <Route path="/astrologers/add" element={<AstrologerForm />} />
            <Route path="/astrologers/edit/:id" element={<AstrologerForm />} />
            <Route path="/astrologers/view/:id" element={<AstrologerDetails />} />
            <Route path="/payouts" element={<Payouts />} />

            {/* CMS Routes */}
            <Route path="/cms/posts" element={<PostList />} />
            <Route path="/cms/posts/new" element={<PostEditor />} />
            <Route path="/cms/posts/edit/:id" element={<PostEditor />} />

            <Route path="/cms/pages" element={<PageList />} />
            <Route path="/cms/pages/new" element={<PageEditor />} />
            <Route path="/cms/pages/edit/:id" element={<PageEditor />} />

            <Route path="/cms/horoscopes" element={<HoroscopeList />} />
            <Route path="/cms/horoscopes/new" element={<HoroscopeEditor />} />
            <Route path="/cms/horoscopes/edit/:id" element={<HoroscopeEditor />} />

            <Route path="/cms/contact-inquiries" element={<ContactInquiries />} />

            <Route path="/edu-reports" element={<EduReports />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/moderation" element={<ModerationFlags />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
