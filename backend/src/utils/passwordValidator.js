/**
 * Common passwords list (top 10,000 most common) — truncated for performance.
 * Used to reject easily guessable passwords during registration and password changes.
 */
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'shadow', '123123', '654321', 'superman', 'qazwsx',
  'michael', 'football', 'password1', 'password123', 'welcome', 'hello',
  'charlie', 'donald', 'admin', 'admin123', 'root', 'toor', 'pass',
  'test', 'guest', 'master123', 'changeme', '1q2w3e4r', '1q2w3e',
  '1234', '12345', '123456789', '1234567890', '000000', '111111',
]);

/**
 * Check if a password is in the common passwords list (case-insensitive).
 */
export function isCommonPassword(password) {
  return COMMON_PASSWORDS.has(password.toLowerCase().trim());
}

/**
 * Analyze password strength and return detailed feedback.
 * @param {string} password - The password to analyze
 * @returns {{ score: number, feedback: string[], meetsRequirements: boolean }}
 */
export function analyzePasswordStrength(password) {
  const feedback = [];
  let score = 0;

  // Length checks
  if (password.length >= 10) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
    feedback.push('Password must be at least 10 characters long');
  } else {
    feedback.push('Password is too short (minimum 10 characters)');
  }

  if (password.length >= 14) score += 1;
  if (password.length >= 20) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 2;
  } else {
    feedback.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  // Common password check
  if (isCommonPassword(password)) {
    score = 0;
    feedback.length = 0;
    feedback.push('This password is too common. Please choose a different one.');
    return { score: 0, feedback, meetsRequirements: false };
  }

  // Repeated characters penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }

  // Sequential characters penalty
  const sequentialPatterns = ['abc', 'bcd', 'cde', 'def', 'xyz', '789', '678', '456', '321'];
  const lowerPassword = password.toLowerCase();
  for (const pattern of sequentialPatterns) {
    if (lowerPassword.includes(pattern)) {
      score -= 1;
      feedback.push('Avoid sequential characters');
      break;
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(8, score));

  const meetsRequirements = 
    password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^a-zA-Z0-9]/.test(password) &&
    !isCommonPassword(password);

  return { score, feedback: meetsRequirements ? [] : feedback, meetsRequirements };
}

/**
 * Get a human-readable strength label based on score.
 */
export function getStrengthLabel(score) {
  if (score <= 2) return 'Weak';
  if (score <= 4) return 'Fair';
  if (score <= 6) return 'Good';
  return 'Strong';
}

/**
 * Get a color for the strength indicator.
 */
export function getStrengthColor(score) {
  if (score <= 2) return '#ef4444';   // red
  if (score <= 4) return '#f59e0b';   // amber
  if (score <= 6) return '#3b82f6';   // blue
  return '#10b981';                    // green
}
