import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layout/DashboardLayout';
import Login from './pages/Login';
import Users from './pages/Users';
import Astrologers from './pages/Astrologers';
import AstrologerForm from './pages/AstrologerForm';
import AstrologerDetails from './pages/AstrologerDetails';
import UserDetails from './pages/UserDetails';
import Dashboard from './pages/Dashboard';

import PostList from './pages/cms/PostList';
import PostEditor from './pages/cms/PostEditor';
import PageList from './pages/cms/PageList';
import PageEditor from './pages/cms/PageEditor';
import HoroscopeList from './pages/cms/HoroscopeList';
import HoroscopeEditor from './pages/cms/HoroscopeEditor';
import ContactInquiries from './pages/cms/ContactInquiries';

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
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/view/:id" element={<UserDetails />} />
            <Route path="/astrologers" element={<Astrologers />} />
            <Route path="/astrologers/add" element={<AstrologerForm />} />
            <Route path="/astrologers/edit/:id" element={<AstrologerForm />} />
            <Route path="/astrologers/view/:id" element={<AstrologerDetails />} />

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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
