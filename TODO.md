# 📋 GIKPS Mail - Implementation TODO List

## Phase 1: Critical Fixes (Adapter + ID Exposure)

### [x] Task 1.1: Fix Adapter-Backend Communication ✅ DONE
**File:** `gikpsmail-adapter.js` + `backend/src/routes/emailRoutes.js` + `backend/src/controllers/emailController.js`
- Create a separate JSON endpoint `/api/mail/send-json` for adapter compatibility ✅
- Modify the existing route to accept both JSON and multipart/form-data ✅ (fixed `attachments is not defined` bug)
- Ensure the adapter properly handles CORS for Render deployment ✅
- Add proper error handling with nodemailer-compatible response format ✅

### [x] Task 1.2: Remove User ID Exposure from Email UI ✅ DONE
**Files:** `frontend/src/pages/Dashboard.jsx` + `backend/src/controllers/emailController.js`
- Removed `senderId`/`receiverId` exposure from email detail view ✅
- Backend sanitization now strips internal IDs and adds `isMine` flag instead ✅
- Socket.io events emit sanitized data (no raw IDs) ✅
- Frontend uses `email.isMine` to display "Me" instead of comparing exposed IDs ✅

### [x] Task 1.3: Implement Email Content Encryption ✅ DONE
**Files:** Backend + Database schema
- Add field-level encryption for email text/html content using AES-256-GCM ✅
- Update Prisma schema to support encrypted fields ✅
- Encrypt emails on write, decrypt on read ✅
- Store encryption key in environment variables (never in DB) ✅
- **CRITICAL FIX:** Encryption key now persists across server restarts via `.env` file. Previously, a new random key was generated each restart, breaking decryption of all stored messages.

---

## Phase 2: Security Hardening

### [ ] Task 2.1: Strengthen Password Validation
**Files:** `backend/src/controllers/authController.js` + frontend validation
- Require: uppercase, lowercase, number, special character
- Minimum 10 characters
- Check against common password list
- Add real-time strength meter in UI

### [x] Task 2.2: Add Rate Limiting ✅ DONE
**File:** `backend/src/index.js`
- Install and configure `express-rate-limit` ✅
- Login: 5 attempts per 15 minutes ✅
- Registration: 3 attempts per hour ✅
- Password reset: 3 attempts per hour ✅

### [x] Task 2.3: Remove Debug Token Exposure ✅ DONE
**File:** `backend/src/controllers/authController.js`
- No debug tokens found in codebase ✅

### [ ] Task 2.4: Fix API Key Verify Endpoint
**File:** `backend/src/routes/authRoutes.js` + controller
- Return minimal data (just status, no user details)
- OR create a dedicated `/api/mail/health` endpoint for adapter verification

### [x] Task 2.5: Add Helmet Security Headers ✅ DONE
**File:** `backend/src/index.js`
- Install `helmet` package ✅
- Configure Content-Security-Policy ✅
- Disable X-Frame-Options, X-Content-Type-Options, etc. ✅

---

## Phase 3: UI Modernization

### [ ] Task 3.1: Password Visibility Toggle
**Files:** All pages with password inputs
- Add eye/eye-off icon toggle on all password fields
- Pages affected: Login, Register, ForgotPassword (if applicable), SettingsModal, ResetPassword
- Use React state to toggle between `type="password"` and `type="text"`

### [ ] Task 3.2: Dark Theme Support
**Files:** All CSS files + App.jsx
- Add CSS custom properties for dark theme
- Add theme toggle in Settings/Profile
- Persist theme preference in localStorage
- Respect system preference via `prefers-color-scheme`
- Pages affected: Login, Register, Dashboard, all modals

### [ ] Task 3.3: Enhanced Form Validation UI
**Files:** All form pages
- Real-time validation feedback (green/red borders)
- Password strength indicator bar
- Character count for username/email fields
- Inline error messages below each field

---

## Phase 4: Legal & Compliance

### [ ] Task 4.1: Terms of Service Page
**File:** `frontend/src/pages/TermsOfService.jsx` + routes
- Acceptance checkbox on registration
- Link in footer of all pages
- Liability limitation clauses
- Acceptable use policy
- Data handling disclosure

### [ ] Task 4.2: Privacy Policy Page  
**File:** `frontend/src/pages/PrivacyPolicy.jsx` + routes
- Data collection practices
- Email encryption disclosure
- Third-party services (Cloudinary, MongoDB)
- User rights and data deletion
- Contact information

### [ ] Task 4.3: Acceptable Use Policy / Disclaimer
**File:** `frontend/src/pages/AcceptableUse.jsx` + routes
- Prohibited content list
- Spam policy
- GIKPS liability limitation
- Service availability disclaimer
- Account termination clauses

### [ ] Task 4.4: Legal Footer on All Pages
- Add footer with links to ToS, Privacy Policy, AUP
- Add copyright notice for GIKPS
- Add "By using this service you agree to..." checkbox on registration

---

## Phase 5: Additional Improvements

### [ ] Task 5.1: CORS Hardening
**File:** `backend/src/index.js`
- Specify exact allowed origins instead of wildcard
- Configure credentials properly
- Add preflight handling

### [ ] Task 5.2: Environment Variable Security
**File:** `.env.example` (create)
- Create template with placeholder values
- Update .gitignore to exclude .env files
- Document required production variables

### [ ] Task 5.3: Input Sanitization
**Files:** All controllers
- Sanitize HTML input to prevent XSS
- Escape user-generated content before rendering
- Validate attachment types and sizes

---

## Priority Summary

| Priority | Tasks | Impact |
|----------|-------|--------|
| 🔴 CRITICAL | 1.1, 1.2, 1.3 | Security breach prevention |
| 🟠 HIGH | 2.1, 2.2, 2.3, 2.4, 2.5 | Attack surface reduction |
| 🟡 MEDIUM | 3.1, 3.2, 3.3 | User experience improvement |
| 📋 LEGAL | 4.1, 4.2, 4.3, 4.4 | Legal protection |
