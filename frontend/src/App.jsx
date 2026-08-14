import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AcceptableUse from './pages/AcceptableUse';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null; // Or a loading spinner
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Theme toggle button component
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  useEffect(() => {
    // Show theme toggle only on dashboard
  }, [theme]);
  
  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Toggle theme from ${theme} to ${theme === 'dark' ? 'light' : 'dark'}`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

// Legal footer component
function LegalFooter() {
  return (
    <footer className="legal-footer">
      <div className="legal-footer-links">
        <a href="/terms">Terms of Service</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/acceptable-use">Acceptable Use Policy</a>
      </div>
      <p className="legal-footer-copyright">
        © {new Date().getFullYear()} GIKPS. All rights reserved.
      </p>
    </footer>
  );
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// Wrapper that adds theme toggle and legal footer based on route
function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {isDashboard && <ThemeToggle />}
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <div className="auth-page-wrapper">
              <Login />
              <LegalFooter />
            </div>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <div className="auth-page-wrapper">
              <Register />
              <LegalFooter />
            </div>
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Legal Pages */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/acceptable-use" element={<AcceptableUse />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
