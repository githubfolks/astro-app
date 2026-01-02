import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layout/DashboardLayout';
import Login from './pages/Login';
import Users from './pages/Users';
import Astrologers from './pages/Astrologers';

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
              <Route path="/" element={<Navigate to="/users" replace />} />
              <Route path="/users" element={<Users />} />
              <Route path="/astrologers" element={<Astrologers />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
