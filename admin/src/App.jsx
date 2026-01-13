import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layout/DashboardLayout';
import Login from './pages/Login';
import Users from './pages/Users';
import Astrologers from './pages/Astrologers';
import AstrologerForm from './pages/AstrologerForm';

import AstrologerDetails from './pages/AstrologerDetails';
import UserDetails from './pages/UserDetails';
import Dashboard from './pages/Dashboard';

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
      <ThemeProvider theme={theme}>
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
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
