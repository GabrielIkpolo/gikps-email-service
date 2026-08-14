import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import { toast } from 'react-hot-toast';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!credentials.username.trim()) {
      newErrors.username = 'Username or email is required';
    } else if (credentials.username.includes('@') && !emailRegex.test(credentials.username)) {
      newErrors.username = 'Please enter a valid email address';
    }

    if (!credentials.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      await login(credentials);
      toast.success('Welcome back!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      setErrors({ form: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">GikpsMail</h2>
          <p className="login-subtitle">Welcome back! Please enter your details.</p>
        </div>

        {errors.form && (
          <div className="form-error-banner" role="alert">{errors.form}</div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username or email"
              value={credentials.username}
              onChange={handleChange}
              autoComplete="username"
              aria-invalid={!!errors.username}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <PasswordInput
            id="login-password"
            name="password"
            label="Password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            showStrength={false}
            error={errors.password}
          />

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <span className="loading-text">Signing in...</span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Create one now</Link></p>
          <p><Link to="/forgot-password">Forgot password?</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
