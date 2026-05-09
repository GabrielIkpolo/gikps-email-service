import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, checkUsername } from '../api/authApi';
import { toast } from 'react-hot-toast';
import './Register.css';

const Register = () => {
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: ''
  });
  const [usernameStatus, setUsernameStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debounceTimer = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'username') {
      const normalizedUsername = value.toLowerCase();
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
    } else {
      setUserData({ ...userData, [name]: value });
    }
  };

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userData.fullName.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!userData.username.trim()) {
      toast.error('Username is required');
      return false;
    }
    if (usernameStatus === 'taken') {
      toast.error('Username is already taken');
      return false;
    }
    if (!userData.email || !emailRegex.test(userData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (userData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }
    return true;
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
              required
            />
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
              required
            />
            <div className={`username-hint ${usernameStatus}`}>
              {usernameStatus === 'checking' && <span>Checking availability...</span>}
              {usernameStatus === 'available' && <span>✓ Username is available!</span>}
              {usernameStatus === 'taken' && <span>✗ Username is already taken</span>}
              {userData.username && usernameStatus === 'idle' && userData.username.length < 3 && (
                <span>Username must be at least 3 characters</span>
              )}
            </div>
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
              required
            />
            {userData.username && (
               <div className="email-hint">
                 Suggested: {userData.username}@gikpsmail.com
               </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={userData.password}
              onChange={handleChange}
              required
            />
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
