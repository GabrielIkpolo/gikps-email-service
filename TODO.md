# TODO: Fix Attachment Sending on Render.com

## Problem Analysis
When sending emails with attachments via the Nodemailer adapter (`send-json` endpoint) on Render.com:
- The image **does** appear in Cloudinary (upload starts but never completes from server side)
- The email request hangs indefinitely and eventually fails
- The recipient never receives the email
- Without attachments, everything works fine

## Root Cause
In `emailController.js`, the `sendEmailJson` function processes attachments but **never uploads them to Cloudinary**. It just stores empty URLs:
```javascript
processedAttachments = attachments.map(att => ({
  url: att.url || '',        // ← Empty! No upload happens
  filename: att.filename,
  mimeType: att.mimeType,
  size: att.size || 0,       // ← Zero! Not calculated from base64
}));
```

The `sendEmail` (multipart) endpoint correctly calls `uploadFile()` which uploads to Cloudinary. But `sendEmailJson` skips this entirely.

## Steps to Fix

### ✅ Step 1: Fixed `sendEmailJson` in emailController.js
- Base64 attachment content is now converted to buffers
- Each attachment is uploaded via `uploadFile()` (same Cloudinary logic as multipart)
- Returned URLs are stored in the database properly
- Handles both raw base64 and data URI format (`data:image/png;base64,...`)
- Gracefully handles upload failures with logging

### ✅ Step 2: Increased adapter timeout from 30s to 3 minutes
- Updated default timeout in `gikpsmail-adapter.js` from 30000ms → 180000ms (3 min)
- This accommodates large attachment uploads on Render's free tier (cold starts + upload time)

### ✅ Step 3: Created local test script
- `backend/test-adapter-attachment.js` — tests the full flow with a real image attachment

## Files Changed
1. **`backend/src/controllers/emailController.js`** — Rewrote attachment handling in `sendEmailJson`
2. **`gikpsmail-adapter.js`** — Increased default timeout from 30s to 3 minutes
3. **`backend/test-adapter-attachment.js`** (new) — Local test script
