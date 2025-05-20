import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { WardrobePage } from './pages/WardrobePage';
import ProfilePage from './pages/ProfilePage';
import { SignupPage } from './pages/SignupPage';
import { CompleteProfilePage } from './pages/CompleteProfilePage';
import { Toast } from './components/Toast';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    // Handle token in URL for OAuth2 redirect
    const token = searchParams.get('token');
    const username = searchParams.get('username');
    if (token && username) {
      login(token, username);
    }
  }, [searchParams, login]);

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
          <Toast />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
