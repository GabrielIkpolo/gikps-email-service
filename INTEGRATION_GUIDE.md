# 📧 GikpsMail Integration Guide

## Complete Handover Documentation for Integrating GikpsMail into Your Applications

---

## Table of Contents

1. [Overview](#overview)
2. [What Problem Does GikpsMail Solve?](#what-problem-does-gikpsmail-solve)
3. [Quick Integration (5 Minutes)](#quick-integration-5-minutes)
4. [Detailed Adapter Usage](#detailed-adapter-usage)
5. [API Reference](#api-reference)
6. [Common Use Cases with Code Examples](#common-use-cases-with-code-examples)
7. [Handling Attachments](#handling-attachments)
8. [Error Handling](#error-handling)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## Overview

**GikpsMail** is a **drop-in replacement for Nodemailer** that sends emails via HTTP/HTTPS REST API instead of SMTP. It was specifically designed to work on platforms like Render.com where traditional SMTP ports are blocked.

### Key Benefits
- ✅ **One-line swap**: Replace `nodemailer.createTransport()` with `createTransport()` from GikpsMail
- ✅ **Same interface**: All Nodemailer options (`to`, `from`, `subject`, `text`, `html`, `attachments`) work identically
- ✅ **No SMTP needed**: Uses HTTPS, works on any platform that allows HTTP requests
- ✅ **Attachments supported**: Send files up to 25MB with proper MIME type handling

---

## What Problem Does GikpsMail Solve?

### The Render.com SMTP Block Problem

Many hosting platforms (Render, Heroku free tier, etc.) block outbound connections on SMTP ports:
- Port 25 (plain SMTP) — **BLOCKED**
- Port 465 (SMTPS) — **BLOCKED**  
- Port 587 (STARTTLS) — **BLOCKED**

This means you **cannot use Nodemailer with SendGrid, Mailgun, AWS SES, or any traditional email provider** on these platforms.

### The GikpsMail Solution

Instead of SMTP, GikpsMail uses HTTPS REST API calls:
```
Your App → POST https://gikps-email-service.onrender.com/api/mail/send-json → Email Stored & Delivered
```

This works because **HTTPS (port 443) is never blocked**.

---

## Quick Integration (5 Minutes)

### Step 1: Copy the Adapter File

```bash
# From your project root, copy the adapter
cp path/to/custom-email-service/gikpsmail-adapter.js ./utils/gikpsmail-adapter.js
```

Or simply download it from the repository.

### Step 2: Add Environment Variables

Add these to your `.env` file:

```env
# GikpsMail Configuration
GIKPSMAIL_API_URL=https://gikps-email-service.onrender.com
GIKPSMAIL_API_KEY=your-master-api-key-here

# Optional: Override default sender info
EMAIL_FROM_NAME="Your App Name"
EMAIL_FROM_ADDRESS=noreply@yourapp.com
```

### Step 3: Replace Nodemailer Code

**Before (Nodemailer):**
```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY }
});

await transporter.sendMail({
  from: '"My App" <noreply@myapp.com>',
  to: 'user@example.com',
  subject: 'Hello!',
  text: 'This is a test email'
});
```

**After (GikpsMail):**
```javascript
import { createTransport } from './utils/gikpsmail-adapter.js';

const transporter = createTransport({
  host: process.env.GIKPSMAIL_API_URL,
  auth: { api_key: process.env.GIKPSMAIL_API_KEY }
});

await transporter.sendMail({
  from: '"My App" <noreply@myapp.com>',
  to: 'user@example.com',
  subject: 'Hello!',
  text: 'This is a test email'
});
```

**That's it!** Your emails will now be sent via GikpsMail instead of SMTP.

---

## Detailed Adapter Usage

### Creating the Transporter

```javascript
import { createTransport } from './utils/gikpsmail-adapter.js';

// Method 1: Using environment variables (recommended)
const transporter = createTransport();

// Method 2: Explicit configuration
const transporter = createTransport({
  host: 'https://gikps-email-service.onrender.com',  // Your GikpsMail URL
  auth: {
    api_key: 'your-master-api-key-here',              // Master API Key
    fromName: 'My App',                                // Default sender name
    fromAddress: 'noreply@myapp.com',                  // Default from address
  },
  timeout: 30000,  // Request timeout in milliseconds (default: 30s)
});
```

### Sending Emails

The `sendMail()` method accepts the **exact same options** as Nodemailer:

```javascript
const info = await transporter.sendMail({
  from: '"My App" <noreply@myapp.com>',    // Sender (string or object)
  to: 'recipient@example.com',             // Required: single or array of recipients
  cc: ['cc1@example.com', 'cc2@example.com'],  // Optional CC
  bcc: ['bcc1@example.com'],               // Optional BCC
  subject: 'Email Subject Line',           // Required
  text: 'Plain text version of the email', // Plain text body
  html: '<h1>HTML version</h1><p>Rich content</p>', // HTML body
});

console.log('Message sent:', info.messageId);
```

### Response Format

The adapter returns a Nodemailer-compatible response object:

```javascript
{
  messageId: 'msg_1234567890_abc123',  // Unique message ID from GikpsMail
  accepted: ['recipient@example.com'], // List of successfully accepted recipients
  rejected: [],                         // List of failed recipients (always empty for HTTP)
  envelope: {
    from: 'noreply@myapp.com',          // Parsed sender address
    to: ['recipient@example.com']       // Parsed recipient addresses
  },
  message: 'Email sent successfully'     // Status message
}
```

### Verifying Configuration

```javascript
const isValid = await transporter.verify();
if (isValid) {
  console.log('GikpsMail is configured correctly');
} else {
  console.error('GikpsMail configuration error. Check your API key and URL.');
}
```

### Closing the Transporter

```javascript
// HTTP transport doesn't maintain connections, so this is a no-op
await transporter.close();
```

---

## API Reference

### `createTransport(config)`

Creates a GikpsMail transporter instance.

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `config.host` | `string` | GikpsMail API URL | From `GIKPSMAIL_API_URL` env var |
| `config.auth.api_key` | `string` | Master API Key | From `GIKPSMAIL_API_KEY` env var |
| `config.auth.fromName` | `string` | Default sender display name | From `EMAIL_FROM_NAME` or `'GikpsMail Service'` |
| `config.auth.fromAddress` | `string` | Default from email address | From `EMAIL_FROM_ADDRESS` or `'noreply@gikpsmail.com'` |
| `config.timeout` | `number` | Request timeout in ms | `30000` (30 seconds) |

### `transporter.sendMail(options)`

Sends an email. Accepts all standard Nodemailer options.

**Required fields:**
- `to` — Recipient email address(es)
- `subject` — Email subject line

**Optional fields:**
- `from` — Sender (defaults to configured fromName/fromAddress)
- `cc`, `bcc` — Carbon copy recipients
- `text` — Plain text body
- `html` — HTML body (falls back to text if not provided)
- `attachments` — Array of attachment objects

**Returns:** `Promise<Object>` — Nodemailer-compatible response object

### `transporter.verify()`

Verifies the transporter configuration.

**Returns:** `Promise<boolean>` — `true` if configuration is valid

---

## Common Use Cases with Code Examples

### 1. User Registration Email Verification

```javascript
import crypto from 'crypto';
import { createTransport } from './utils/gikpsmail-adapter.js';

const transporter = createTransport();

async function sendVerificationEmail(user) {
  // Generate verification token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Save token to your database with expiry (e.g., 1 hour)
  await db.verificationTokens.create({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 3600000)
  });

  const verificationUrl = `https://yourapp.com/verify-email?token=${token}`;

  await transporter.sendMail({
    from: '"Your App" <noreply@yourapp.com>',
    to: user.email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome to Your App!</h1>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" 
           style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email Address
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `
  });

  return { success: true };
}
```

### 2. Password Reset Flow

```javascript
import crypto from 'crypto';
import { createTransport } from './utils/gikpsmail-adapter.js';

const transporter = createTransport();

async function sendPasswordResetEmail(user) {
  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Save to database with expiry
  await db.resetTokens.create({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 3600000) // 1 hour
  });

  const resetUrl = `https://yourapp.com/reset-password?token=${token}`;

  await transporter.sendMail({
    from: '"Your App Security" <security@yourapp.com>',
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Password Reset</h1>
        <p>We received a request to reset your password. Click the button below to create a new one:</p>
        <a href="${resetUrl}" 
           style="background-color: #2196F3; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, no action is needed. Your current password remains unchanged.</p>
      </div>
    `
  });

  return { success: true };
}
```

### 3. Transactional Alert / Notification

```javascript
import { createTransport } from './utils/gikpsmail-adapter.js';

const transporter = createTransport();

async function sendOrderConfirmation(order) {
  await transporter.sendMail({
    from: '"Your App Orders" <orders@yourapp.com>',
    to: order.customerEmail,
    subject: `Order #${order.number} Confirmed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Order Confirmed!</h1>
        <p>Thank you for your order, ${order.customerName}.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Order Number</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">#${order.number}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">$${order.total.toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Estimated Delivery</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${order.estimatedDelivery}</td></tr>
        </table>
        
        <p>We'll send you a shipping notification when your order ships.</p>
      </div>
    `
  });
}
```

### 4. Welcome Email with Branding

```javascript
import { createTransport } from './utils/gikpsmail-adapter.js';

const transporter = createTransport();

async function sendWelcomeEmail(user) {
  await transporter.sendMail({
    from: '"Your App Team" <team@yourapp.com>',
    to: user.email,
    subject: `Welcome to Your App, ${user.fullName}! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome Aboard! 🎉</h1>
        </div>
        
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Hi ${user.fullName},</p>
          <p>Welcome to Your App! We're excited to have you on board.</p>
          
          <h3>Getting Started:</h3>
          <ol>
            <li>Complete your profile setup</li>
            <li>Explore our features</li>
            <li>Connect with other users</li>
          </ol>
          
          <a href="https://yourapp.com/dashboard" 
             style="background-color: #667eea; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">
            Go to Dashboard
          </a>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>If you have any questions, reply to this email or visit our help center.</p>
          <p>&copy; 2024 Your App. All rights reserved.</p>
        </div>
      </div>
    `
  });
}
```

---

## Handling Attachments

### Sending Attachments via Adapter

The adapter expects attachments as **base64-encoded strings**:

```javascript
import fs from 'fs';
import { createTransport } from './utils/gikpsmail-adapter.js';

const transporter = createTransport();

async function sendEmailWithAttachment(recipient) {
  // Read file and convert to base64
  const fileBuffer = fs.readFileSync('./documents/report.pdf');
  const base64Content = fileBuffer.toString('base64');

  await transporter.sendMail({
    from: '"Your App" <noreply@yourapp.com>',
    to: recipient,
    subject: 'Document Attached',
    text: 'Please find the attached document.',
    html: '<p>Please find the attached document.</p>',
    attachments: [{
      filename: 'report.pdf',
      content: base64Content,           // Base64 encoded string
      contentType: 'application/pdf',   // MIME type (optional)
    }]
  });
}

// Multiple attachments
async function sendEmailWithMultipleAttachments(recipient) {
  const files = [
    { path: './docs/manual.pdf', name: 'User Manual.pdf' },
    { path: './images/logo.png', name: 'Company Logo.png' },
  ];

  const attachments = await Promise.all(files.map(async (file) => ({
    filename: file.name,
    content: fs.readFileSync(file.path).toString('base64'),
    contentType: getFileMimeType(file.name),
  })));

  await transporter.sendMail({
    from: '"Your App" <noreply@yourapp.com>',
    to: recipient,
    subject: 'Multiple Documents Attached',
    text: 'Please find the attached documents.',
    attachments,
  });
}

function getFileMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
```

### File Size Limits

- **Maximum file size**: 25MB per attachment
- **Maximum attachments per email**: 5 files
- **Total payload limit**: ~10MB (JSON) or 25MB (multipart form data)

---

## Error Handling

The adapter throws Nodemailer-compatible errors:

```javascript
try {
  await transporter.sendMail({ /* ... */ });
} catch (error) {
  // Check error type
  if (error.code === 'E401' || error.code === 'E403') {
    console.error('Authentication failed. Check your API key.');
  } else if (error.code === 'E404') {
    console.error('Recipient not found in GikpsMail system.');
  } else if (error.code === 'ENETWORK' || error.message.includes('timeout')) {
    console.error('Network error. Check your connection or try again later.');
  } else {
    console.error('Failed to send email:', error.message);
  }
}
```

### Common Error Codes

| Code | HTTP Status | Meaning | Solution |
|------|-------------|---------|----------|
| `E401` | 401 | Invalid API key | Check `GIKPSMAIL_API_KEY` |
| `E403` | 403 | Forbidden/Blocked | Contact admin, check rate limits |
| `E404` | 404 | Recipient not found | Verify recipient has a GikpsMail account |
| `ENETWORK` | N/A | Network timeout | Check connection, increase timeout |

---

## Troubleshooting

### Issue: Emails are hanging/not sending on Render

**Solution:**
1. Ensure your API URL is correct (no trailing slash): `https://gikps-email-service.onrender.com`
2. Increase the timeout in adapter config: `timeout: 60000`
3. Check Cloudinary credentials if using attachments
4. Verify CORS origins include your application's domain

### Issue: "No response from server" error

**Solution:**
1. Check that GikpsMail service is running (check Render dashboard)
2. Verify network connectivity from your hosting platform
3. Ensure no firewall rules are blocking outbound HTTPS

### Issue: Attachments not working

**Solution:**
1. Ensure files are converted to base64 before passing to `sendMail()`
2. Check file size doesn't exceed 25MB
3. Verify MIME types are correct for proper rendering

---

## Security Best Practices

1. **Never expose your Master API Key in client-side code** — The adapter should only be used server-side
2. **Use environment variables** for all credentials
3. **Validate recipient emails** before sending to prevent abuse
4. **Implement rate limiting** on your application layer if handling user-triggered emails
5. **Use HTTPS** for the API URL (never use HTTP in production)
6. **Rotate your API keys** periodically

---

## Support

For issues or questions:
- Check the [README.md](./README.md) for setup instructions
- Review the [TODO.md](./TODO.md) for known issues and planned features
- Check the GikpsMail service logs on Render for backend errors
