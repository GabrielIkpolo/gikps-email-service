import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import { checkUsername } from '../api/authApi';
import { toast } from 'react-hot-toast';
import './Register.css';

const Register = () => {
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { register } = useAuth();
  const debounceTimer = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'username') {
      // Only allow alphanumeric and underscores
      const normalizedUsername = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setUserData(prev => ({
        ...prev,
        username: normalizedUsername,
        email: normalizedUsername ? `${normalizedUsername}@gikpsmail.com` : ''
      }));

      // Debounce availability check
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (normalizedUsername.length >= 3) {
        setUsernameStatus('checking');
        debounceTimer.current = setTimeout(async () => {
          try {
            const { data } = await checkUsername(normalizedUsername);
            if (data.available) {
              setUsernameStatus('available');
            } else {
              setUsernameStatus('taken');
            }
          } catch (err) {
            console.error('Error checking username availability:', err);
            setUsernameStatus('idle');
          }
        }, 500);
      } else {
        setUsernameStatus('idle');
      }
    } else if (name === 'fullName') {
      // Limit to letters, spaces, hyphens, and apostrophes
      const sanitized = value.replace(/[^a-zA-Z\s\-']/g, '');
      setUserData(prev => ({ ...prev, fullName: sanitized }));
    } else {
      setUserData({ ...userData, [name]: value });
    }
    
    // Clear field error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (userData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!userData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (userData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-z0-9_]+$/.test(userData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (usernameStatus === 'taken') {
      newErrors.username = 'Username is already taken';
    }

    if (!userData.email || !emailRegex.test(userData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation with strength requirements
    const password = userData.password;
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Terms acceptance
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and policies to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      await register(userData);
      toast.success('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      setErrors({ form: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2 className="register-title">Join GikpsMail</h2>
          <p className="register-subtitle">Create your professional email account</p>
        </div>

        {errors.form && (
          <div className="form-error-banner" role="alert">{errors.form}</div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="John Doe"
              value={userData.fullName}
              onChange={handleChange}
              autoComplete="name"
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="johndoe123"
              value={userData.username}
              onChange={handleChange}
              autoComplete="username"
              aria-invalid={!!errors.username}
            />
            <div className={`username-hint ${usernameStatus}`}>
              {usernameStatus === 'checking' && <span>Checking availability...</span>}
              {usernameStatus === 'available' && <span>✓ Username is available!</span>}
              {usernameStatus === 'taken' && <span>✗ Username is already taken</span>}
              {userData.username && usernameStatus === 'idle' && userData.username.length < 3 && (
                <span>Username must be at least 3 characters</span>
              )}
            </div>
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="john@example.com"
              value={userData.email}
              onChange={handleChange}
              autoComplete="email"
              readOnly
              className="readonly-input"
            />
            {userData.username && (
               <div className="email-hint">
                 Your GikpsMail address: <strong>{userData.username}@gikpsmail.com</strong>
               </div>
            )}
          </div>

          <PasswordInput
            id="register-password"
            name="password"
            label="Create Password"
            value={userData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            showStrength={true}
            error={errors.password}
          />

          {/* Terms acceptance checkbox */}
          <div className={`form-group terms-group ${errors.terms ? 'has-error' : ''}`}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                }}
              />
              <span className="checkbox-text">
                I agree to the{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link>,
                {' '}
                <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>, and
                {' '}
                <Link to="/acceptable-use" target="_blank" rel="noopener noreferrer">Acceptable Use Policy</Link>
              </span>
            </label>
            {errors.terms && <span className="field-error">{errors.terms}</span>}
          </div>

          <button type="submit" className="register-button" disabled={loading || usernameStatus === 'checking'}>
            {loading ? (
              <span className="loading-text">Creating account...</span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
