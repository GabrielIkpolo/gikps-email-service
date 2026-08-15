import React, { useState } from 'react';
import { HiEye, HiEyeOff, HiShieldCheck, HiShieldExclamation } from 'react-icons/hi';
import './PasswordInput.css';

/**
 * Password input component with visibility toggle and strength indicator
 * Features: Modern glassmorphism styling, animated strength bar, requirements checklist
 */
const PasswordInput = ({ 
  id, 
  name, 
  value, 
  onChange, 
  placeholder = '••••••••',
  label,
  required = false,
  showStrength = true,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Calculate password strength (0-6 scale)
  const getStrength = (password) => {
    if (!password) return { score: 0, label: '', className: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', className: 'weak', color: '#ef4444' };
    if (score <= 3) return { score: 2, label: 'Fair', className: 'fair', color: '#f59e0b' };
    if (score <= 4) return { score: 3, label: 'Good', className: 'good', color: '#3b82f6' };
    return { score: 4, label: 'Strong', className: 'strong', color: '#10b981' };
  };

  const strength = getStrength(value);

  // Password requirements checklist
  const requirements = [
    { test: value.length >= 8, text: 'At least 8 characters' },
    { test: /[A-Z]/.test(value), text: 'One uppercase letter' },
    { test: /[a-z]/.test(value), text: 'One lowercase letter' },
    { test: /[0-9]/.test(value), text: 'One number' },
    { test: /[^A-Za-z0-9]/.test(value), text: 'One special character' },
  ];

  const metCount = requirements.filter(r => r.test).length;
  const isComplete = metCount === requirements.length;

  return (
    <div className="password-input-wrapper">
      {label && (
        <label htmlFor={id} className="password-label">
          {label}
          {showStrength && value && (
            <span className={`strength-badge ${strength.className}`}>
              {isComplete ? <HiShieldCheck /> : <HiShieldExclamation />}
              {strength.label}
            </span>
          )}
        </label>
      )}
      
      <div className={`input-with-toggle ${error ? 'has-error' : ''} ${value && !error ? 'has-value' : ''}`}>
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex="-1"
        >
          {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <span id={`${id}-error`} className="field-error" role="alert">
          {error}
        </span>
      )}

      {/* Password strength indicator and requirements */}
      {showStrength && value && (
        <div className="password-requirements">
          <div className="strength-bar-container">
            <div 
              className={`password-strength-bar ${strength.className}`} 
              style={{ '--strength-width': `${(strength.score / 4) * 100}%` }}
            />
            <span className="strength-text" style={{ color: strength.color }}>
              {strength.label} ({metCount}/{requirements.length})
            </span>
          </div>
          
          {!isComplete && (
            <ul className="requirements-list">
              {requirements.map((req, index) => (
                <li key={index} className={`requirement-item ${req.test ? 'met' : ''}`}>
                  <span className={`check-icon ${req.test ? 'checked' : 'unchecked'}`}>
                    {req.test ? '✓' : '○'}
                  </span> 
                  {req.text}
                </li>
              ))}
            </ul>
          )}

          {isComplete && (
            <div className="requirements-complete">
              <HiShieldCheck size={18} /> All requirements met!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
