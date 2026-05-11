import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe as getMeApi } from '../api/authApi';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initial check: Is the user already logged in?
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('gikpsmail_token');
      if (token) {
        try {
          const response = await getMeApi();
          if (response.status === 'success') {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // Token is invalid or expired
            logout();
          }
        } catch (error) {
          console.error('Failed to verify authentication:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    const data = await loginApi(credentials);
    if (data.token) {
      localStorage.setItem('gikpsmail_token', data.token);
      setUser(data.data.user);
      setIsAuthenticated(true);
      navigate('/dashboard');
    }
    return data;
  };

  const register = async (userData) => {
    const data = await registerApi(userData);
    // After registration, we might want to automatically log them in 
    // or redirect them to login. Let's redirect to login for now.
    return data;
  };

  const logout = () => {
    localStorage.removeItem('gikpsmail_token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
