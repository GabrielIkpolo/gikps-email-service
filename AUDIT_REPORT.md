# 🔍 GIKPS Mail - Comprehensive Security & Code Audit Report

**Date:** $(date)  
**Auditor:** AI Code Assistant  
**Scope:** Full-stack audit (Backend + Frontend + Adapter)

---

## 🚨 CRITICAL ISSUES (Must Fix Immediately)

### 1. User ID Exposure in Email UI
**Severity:** 🔴 HIGH  
**Location:** `frontend/src/pages/Dashboard.jsx` (line ~230)

```jsx
// CURRENT - EXPOSES INTERNAL USER ID:
<span className="author-email">
  {selectedEmail.sender?.fullName || selectedEmail.sender?.username}
  ({selectedEmail.sender?.email || selectedEmail.senderId}) // ← senderId exposed!
</span>
```

**Impact:** Any user viewing an email can see the internal MongoDB ObjectId of the sender. This leaks system internals and could be used for enumeration attacks.

---

### 2. No Email Content Encryption
**Severity:** 🔴 CRITICAL  
**Location:** Backend storage, database, transmission

- Emails stored in **plaintext** in MongoDB
- No encryption at rest (no field-level encryption)
- No TLS/SSL enforcement on the backend
- Password reset tokens logged to console in plaintext

---

### 3. Adapter Incompatibility with Backend
**Severity:** 🔴 CRITICAL  
**Location:** `gikpsmail-adapter.js` vs `backend/src/routes/emailRoutes.js`

The adapter sends **JSON** payloads:
```javascript
// Adapter sends JSON
axios.post(`${this.apiUrl}/api/mail/send`, payload, {
  headers: { 'Content-Type': 'application/json' }
});
```

But the backend expects **multipart/form-data**:
```javascript
// Backend route
router.post('/send', upload.array('attachments'), emailController.sendEmail);
```

**This is why your adapter doesn't work on Render!** The content-type mismatch causes multer to fail, and the JSON body isn't parsed correctly.

---

### 4. API Key Verification Endpoint Leaks User Data
**Severity:** 🟠 HIGH  
**Location:** `backend/src/routes/authRoutes.js`

```javascript
router.get('/verify', validateApiKey, authController.getMe);
// This returns full user data including ID when using MASTER_API_KEY!
```

---

## ⚠️ HIGH PRIORITY ISSUES

### 5. No Password Visibility Toggle
**Severity:** 🟡 MEDIUM  
All password inputs lack a "show/hide" toggle, causing UX friction and potential typos.

### 6. Weak Password Validation
**Severity:** 🟡 MEDIUM  
Current requirements: only `min(8)` characters. Missing:
- Uppercase letter requirement
- Lowercase letter requirement  
- Number requirement
- Special character requirement
- Common password check

### 7. No Rate Limiting
**Severity:** 🔴 HIGH  
No rate limiting on login, registration, or password reset endpoints. Vulnerable to brute-force attacks.

### 8. Debug Token Exposed in Production
**Severity:** 🟠 HIGH  
`authController.js` logs and returns reset tokens:
```javascript
logger.info(`Password reset request for user: ${user.email}. Token: ${resetToken}`);
// ...
debugToken: resetToken, // ONLY FOR TESTING - but still returned!
```

### 9. No Legal Pages (Terms of Service / Privacy Policy)
**Severity:** 🟠 HIGH  
No ToS, Privacy Policy, or liability disclaimers. GIKPS is fully exposed to legal action.

---

## 💡 MEDIUM PRIORITY IMPROVEMENTS

### 10. No Dark Theme Support
Only light theme exists. Modern email clients should support dark mode.

### 11. CORS Configuration Too Permissive
```javascript
app.use(cors()); // Allows ALL origins
// Socket.io: origin: process.env.CLIENT_URL || "*"
```

### 12. Hardcoded JWT Secret in .env
```
JWT_SECRET="your_super_secret_jwt_key_for_gikpsmail"
```

### 13. No Helmet / Security Headers
No `helmet` package for HTTP security headers (X-Content-Type-Options, X-Frame-Options, etc.)

---

## 📋 TODO - IMPLEMENTATION PLAN

See `TODO.md` for the detailed implementation checklist.
