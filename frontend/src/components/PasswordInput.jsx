import React, { useState } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';

/**
 * Password input component with visibility toggle and strength indicator
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

  // Calculate password strength
  const getStrength = (password) => {
    if (!password) return { score: 0, label: '', className: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', className: 'weak' };
    if (score <= 3) return { score: 2, label: 'Fair', className: 'fair' };
    if (score <= 4) return { score: 3, label: 'Good', className: 'good' };
    return { score: 4, label: 'Strong', className: 'strong' };
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

  return (
    <div className="password-input-wrapper">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="input-with-toggle">
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
          <div className={`password-strength-bar ${strength.className}`} />
          <div className="password-strength-label">{strength.label}</div>
          <ul className="requirements-list">
            {requirements.map((req, index) => (
              <li key={index} className={req.test ? 'met' : ''}>
                {req.test ? '✓' : '○'} {req.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
