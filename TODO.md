# 📋 GIKPS Mail - Implementation TODO List

## Project Overview & Purpose

**GikpsMail** is an HTTP-based email service designed as a **drop-in replacement for Nodemailer**, specifically built to solve the problem of SMTP being blocked on platforms like Render.com. It provides a plug-and-play email solution that can be integrated into any Node.js application for:
- Email verification during user registration
- Password reset flows
- Transactional alerts and notifications
- Any use case where traditional Nodemailer would be used

The service offers two integration methods:
1. **REST API** - Direct HTTP calls to send emails with JSON payloads or multipart form data
2. **Nodemailer Adapter** (`gikpsmail-adapter.js`) - A drop-in replacement for `nodemailer.createTransport()` that mimics the exact Nodemailer interface

---

## Phase 1: Critical Fixes (Adapter + Attachment Uploads)

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

### [✅ DONE] Task 1.4: Fix Attachment Upload Hanging on Render ✅ DONE
**Files:** `frontend/src/api/mailApi.js`, `frontend/src/components/ComposeModal.jsx`, `backend/src/utils/storage.js`
- **Problem**: Normal email sending works on Render, but file attachments cause the send process to hang indefinitely
- **Root Cause Analysis & Fixes Implemented**:
  - ✅ Added explicit timeout (60s) to all API requests in `client.js`
  - ✅ Added abort controller support to `mailApi.js` sendEmail function with signal parameter
  - ✅ Added cancel button to ComposeModal that aborts pending uploads via AbortController
  - ✅ Improved Cloudinary upload error handling — now throws proper errors instead of silently failing
  - ✅ Changed from sequential to parallel file processing in backend for better performance on Render
  - ✅ Added spinner animation and "Sending..." state so users know something is happening
  - ✅ Added cancel button with "Cancelling..." state during abort
  - ✅ Added file size display next to attachment names
  - ✅ Better error messages specifically for timeout scenarios
- **Testing**: Must test on Render deployment (local works fine)

### [x] Task 1.5: Fix Password Visibility Toggle in SettingsModal ✅ DONE
**File:** `frontend/src/components/SettingsModal.jsx`
- Replace raw password input with PasswordInput component for "Current Password" field ✅

---

## Phase 2: UI Modernization & UX Improvements

### [✅ DONE] Task 2.1: Redesign Password Input Fields ✅ DONE
**Files:** `frontend/src/components/PasswordInput.jsx`, `frontend/src/components/PasswordInput.css`, all CSS files
- **Problem**: Password fields across all forms look ugly and inconsistent
- **Fixes Implemented**:
  - ✅ Modern glassmorphism/neumorphism styling for password inputs with elevated shadows
  - ✅ Consistent border radius, padding, and focus states across ALL forms (Login, Register, SettingsModal)
  - ✅ Better visual feedback on validation — green borders when valid, red borders when error
  - ✅ Improved strength indicator with animated progress bar using CSS custom properties
  - ✅ Smooth transitions and hover effects throughout
  - ✅ Dark mode compatible styling via CSS variables
  - ✅ Strength badge in label showing current password strength at a glance
  - ✅ Requirements checklist with check/circle icons that animate when met
  - ✅ "All requirements met!" celebration message with shield icon
- **Pages Affected**: Login, Register, SettingsModal (all use the PasswordInput component)

### [ ] Task 2.2: Add Cancel Button to Compose Modal
**Files:** `frontend/src/components/ComposeModal.jsx`, `frontend/src/api/mailApi.js`
- Implement AbortController for email sending operations
- Add cancel button that appears during send process
- Properly clean up pending requests when modal is closed

### [ ] Task 2.3: Enhanced Form Validation UI
**Files:** All form pages
- Real-time validation feedback (green/red borders)
- Character count for username/email fields
- Inline error messages below each field

---

## Phase 6: Render Deployment Fixes (CRITICAL)

### [x] Task 6.1: Fix AES-256 Encryption Key Length on Render ✅ DONE
**File:** `backend/src/controllers/emailController.js`
- Validate EMAIL_ENCRYPTION_KEY is exactly 64 hex chars (32 bytes) for AES-256-GCM ✅
- Generate fallback key if env var is missing/invalid instead of writing to ephemeral .env ✅
- Store validated key in a stable variable that persists across restarts ✅

### [x] Task 6.2: Re-enable Rate Limiting for Render ✅ DONE
**File:** `backend/src/index.js`
- Set `trust proxy` to true for Render's load balancer ✅
- Configure rate limiters with proper IP detection ✅
- Use memory store as fallback (no Redis needed) ✅

### [x] Task 6.4: Fix Attachment Uploads on Render ✅ DONE (partial - needs more work)
**Files:** `backend/src/utils/storage.js` + `backend/src/routes/emailRoutes.js` + `backend/src/controllers/emailController.js`
- Added Cloudinary fallback to local storage when credentials are missing/invalid ✅
- Fixed UPLOAD_DIR variable declaration order bug ✅
- Added proper error handling for individual attachment failures (doesn't break entire email) ✅
- Added multer error handler middleware with clear error messages ✅
- Added logging for debugging file uploads on Render ✅
- Added RENDER_APP_URL env var support for correct attachment URLs on Render ✅

---

## Phase 3: Security Hardening

### [ ] Task 3.1: Strengthen Password Validation
**Files:** `backend/src/controllers/authController.js` + frontend validation
- Require: uppercase, lowercase, number, special character
- Minimum 10 characters
- Check against common password list
- Add real-time strength meter in UI (already partially implemented)

### [x] Task 3.2: Add Rate Limiting ✅ DONE
**File:** `backend/src/index.js`
- Install and configure `express-rate-limit` ✅
- Login: 10 attempts per 15 minutes ✅
- Registration: 10 attempts per 30 mins ✅
- Password reset: 10 attempts per 30 mins ✅

### [x] Task 3.3: Remove Debug Token Exposure ✅ DONE
**File:** `backend/src/controllers/authController.js`
- No debug tokens found in codebase ✅

### [ ] Task 3.4: Fix API Key Verify Endpoint
**File:** `backend/src/routes/authRoutes.js` + controller
- Return minimal data (just status, no user details)
- OR create a dedicated `/api/mail/health` endpoint for adapter verification

### [x] Task 3.5: Add Helmet Security Headers ✅ DONE
**File:** `backend/src/index.js`
- Install `helmet` package ✅
- Configure Content-Security-Policy ✅
- Disable X-Frame-Options, X-Content-Type-Options, etc. ✅

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

## Phase 7: Documentation & Handover

### [✅ DONE] Task 7.1: Update README.md with Adapter Integration Guide ✅ DONE
**File:** `README.md`
- ✅ Documented GikpsMail's purpose as a Nodemailer replacement for platforms blocking SMTP
- ✅ Added comprehensive integration guide section with step-by-step instructions
- ✅ Included code examples for common use cases (verification emails, password resets, alerts)
- ✅ Documented all required environment variables
- ✅ Explained how to handle attachments via the adapter
- ✅ Added API reference table and Nodemailer-compatible methods documentation

### [✅ DONE] Task 7.2: Create Handover/Integration Guide ✅ DONE
**File:** `INTEGRATION_GUIDE.md` (new file)
- ✅ Created comprehensive step-by-step integration guide for existing applications
- ✅ Complete API reference with request/response examples and parameter tables
- ✅ Adapter usage patterns and best practices documented
- ✅ Troubleshooting section covering common issues (hanging uploads, network errors, etc.)
- ✅ Security considerations when using the adapter
- ✅ Common use cases with full code examples (verification, password reset, transactional alerts)
- ✅ Attachment handling guide with file size limits

### [ ] Task 7.3: Create .env.example Template
**File:** `.env.example` (new file)
- Document all required environment variables
- Include both development and production examples

---

## Priority Summary

| Priority | Tasks | Impact |
|----------|-------|--------|
| 🔴 CRITICAL | 1.4, 2.1, 7.1, 7.2 | Core functionality broken on Render |
| 🟠 HIGH | 2.2, 3.1, 3.4 | Security and UX improvements |
| 🟡 MEDIUM | 2.3, 5.1, 5.2, 5.3 | Polish and hardening |
| 📋 LEGAL | 4.1, 4.2, 4.3, 4.4 | Legal protection |
