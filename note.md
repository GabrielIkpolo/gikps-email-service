# =============================================
# LAFIMail Environment Configuration
# =============================================
# Copy this file to .env in your LAFIMail project root

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/lafimail
# For production on Render.com, use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lafimail?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Master API Key (for creating users programmatically)
# This is used by external apps like Lost & Found to create email accounts
MASTER_API_KEY=your-master-api-key-for-external-apps

# Application URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production:
# NEXT_PUBLIC_APP_URL=https://your-lafimail-app.onrender.com

# Node Environment
NODE_ENV=development



====================

/**
 * LAFIMail HTTP Adapter for Nodemailer
 * 
 * This is a drop-in replacement for your existing nodemailer configuration.
 * Instead of using SMTP, it sends emails via HTTP to your LAFIMail service.
 * 
 * Installation:
 * 1. Copy this file to your Lost & Found project (e.g., utils/lafimail-adapter.js)
 * 2. Update your .env file with the LAFIMail configuration
 * 3. Replace your nodemailer imports with this adapter
 * 
 * Environment Variables:
 * - LAFIMAIL_API_URL: URL of your LAFIMail service (e.g., https://your-lafimail-app.onrender.com)
 * - LAFIMAIL_API_KEY: Your LAFIMail API key (get this from your LAFIMail account settings)
 * - EMAIL_FROM_NAME: Display name for sent emails (optional)
 * - EMAIL_FROM_ADDRESS: Default from address (optional, will use your LAFIMail email if not set)
 */

const axios = require('axios');

// Load environment variables
require('dotenv').config();

// Configuration
const LAFIMAIL_API_URL = process.env.LAFIMAIL_API_URL || 'http://localhost:3000';
const LAFIMAIL_API_KEY = process.env.LAFIMAIL_API_KEY;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Lost and Found Item';
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS;

/**
 * HTTP Transporter class that mimics nodemailer's createTransport
 */
class HTTPTransporter {
  constructor(config = {}) {
    this.config = config;
    this.apiUrl = config.apiUrl || LAFIMAIL_API_URL;
    this.apiKey = config.apiKey || LAFIMAIL_API_KEY;
    this.fromName = config.fromName || EMAIL_FROM_NAME;
    this.fromAddress = config.fromAddress || EMAIL_FROM_ADDRESS;
  }

  /**
   * Send mail - mimics nodemailer's sendMail method
   * @param {Object} mailOptions - Email options (from, to, subject, text, html, etc.)
   * @returns {Promise<Object>} - Send result with messageId
   */
  async sendMail(mailOptions) {
    const {
      from,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      replyTo,
    } = mailOptions;

    // Validate required fields
    if (!to) {
      throw new Error('Recipient (to) is required');
    }
    if (!subject) {
      throw new Error('Subject is required');
    }

    // Parse from address
    let fromEmail = this.fromAddress;
    let fromName = this.fromName;

    if (from) {
      if (typeof from === 'string') {
        // Parse "Name <email@example.com>" format
        const match = from.match(/(?:"?([^"]*)"?\s)?<?([^\s>]+@[^\s>]+)>?/);
        if (match) {
          fromName = match[1] || fromName;
          fromEmail = match[2] || fromEmail;
        } else {
          fromEmail = from;
        }
      } else if (typeof from === 'object') {
        fromName = from.name || fromName;
        fromEmail = from.address || fromEmail;
      }
    }

    // Prepare payload
    const payload = {
      to: typeof to === 'string' ? to : to.address || to.email,
      subject,
      text: text || '',
      html: html || text || '',
      fromName,
      fromEmail,
    };

    if (cc) {
      payload.cc = Array.isArray(cc) ? cc : [cc];
    }
    if (bcc) {
      payload.bcc = Array.isArray(bcc) ? bcc : [bcc];
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/api/mail/send`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
        }
      );

      return {
        messageId: response.data.data?.messageId || `msg_${Date.now()}`,
        response: response.data,
        accepted: [to],
        rejected: [],
      };
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(`Failed to send email via LAFIMail: ${message}`);
    }
  }

  /**
   * Verify transporter configuration
   * Mimics nodemailer's verify method
   */
  async verify() {
    try {
      const response = await axios.get(`${this.apiUrl}/api/auth/me`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

/**
 * Create a HTTP transporter (mimics nodemailer.createTransport)
 * @param {Object} config - Configuration options
 * @returns {HTTPTransporter} - Transporter instance
 */
function createTransport(config = {}) {
  return new HTTPTransporter(config);
}

// ============ EMAIL SENDING FUNCTIONS ============
// These functions match your existing email service interface

/**
 * Sends a general email.
 *
 * @param {string} toEmail - The recipient email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plain text body of the email.
 * @param {string} [html] - The HTML body of the email (optional).
 */
const sendEmail = async (toEmail, subject, text, html) => {
  const transporter = createTransport();

  const mailOptions = {
    from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM_ADDRESS || 'noreply@lafimail.internal'}>`,
    to: toEmail,
    subject: subject,
    text: text,
    html: html || text,
  };

  try {
    console.log(`Attempting to send email to ${toEmail} with subject "${subject}"...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Verification email using the generic sendEmail function
 * @param {string} toEmail - Recipient email
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (toEmail, token) => {
  const clientUrl = process.env.CLIENT_URL || process.env.VITE_REACT_APP_API_CLIENT_URL || 'http://localhost:5173';
  const verificationLink = `${clientUrl}/verify-email?token=${token}`;
  
  const subject = 'Verify Your Email Address';
  const text = `Hello,\n\nPlease verify your email address by clicking this link: ${verificationLink}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe LAFI Team`;
  const html = `<p>Hello,</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verificationLink}">Verify Email Address</a></p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>LAFI Team</p>`;

  return sendEmail(toEmail, subject, text, html);
};

/**
 * Password reset email
 * @param {string} toEmail - Recipient email
 * @param {string} token - Reset token
 * @param {string} [resetUrl] - Optional custom reset URL
 */
const sendPasswordResetEmail = async (toEmail, token, resetUrl) => {
  const clientUrlFromEnv = process.env.CLIENT_URL || process.env.VITE_REACT_APP_API_CLIENT_URL || process.env.VITE_APP_CLIENT_URL;
  const clientUrl = resetUrl ? undefined : (process.env.NODE_ENV === 'production' ? clientUrlFromEnv : 'http://localhost:5173');
  const fullResetUrl = resetUrl || `${clientUrl}/reset-password/${token}`;

  const subject = 'Password Reset Request';
  const text = `Hello,\n\nYou requested a password reset. Click the link below to reset your password:\n\n${fullResetUrl}\n\nThis link is valid for 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe LAFI Team`;
  const html = `<p>Hello,</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${fullResetUrl}">${fullResetUrl}</a></p><p>This link is valid for 15 minutes.</p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>LAFI Team</p>`;

  return sendEmail(toEmail, subject, text, html);
};

/**
 * Sends handover instructions with Proof of Ownership message.
 * @param {Object} reporter - The person who found the item
 * @param {Object} claimant - The person claiming the item
 * @param {Object} item - The lost item
 * @param {string} proofMessage - Proof of ownership message from claimant
 */
const sendHandoverEmail = async (reporter, claimant, item, proofMessage) => {
  const safeLocation = "Campus Security Post (Main Gate)";

  // Email to the Reporter (Finder)
  const reporterSubject = `Action Required: Claim request for "${item.title}"`;
  const reporterHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Good news, ${reporter.name}!</h2>
      <p>The item you reported found (<strong>${item.title}</strong>) has been claimed by <strong>${claimant.name}</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #555;">Claimant's Proof of Ownership:</h3>
        <p style="font-style: italic; font-size: 1.1em; color: #21135d;">
          "${proofMessage || 'No specific detail provided.'}"
        </p>
        <p style="font-size: 0.9em; color: #666;">
          *Please verify this matches the item before handing it over.*
        </p>
      </div>

      <hr />
      <h3>Claimant Contact Details:</h3>
      <p><strong>Email:</strong> ${claimant.email}</p>
      <p><strong>Phone:</strong> ${claimant.phone || 'Not provided'}</p>
      <hr />
      
      <p>Please contact them to arrange a handover.</p>
      <p style="background-color: #e7f3fe; padding: 10px; border-left: 5px solid #2196F3;">
        <strong>Safety Tip:</strong> We recommend meeting at the <strong>${safeLocation}</strong>.
      </p>
    </div>
  `;

  // Email to the Claimant (Owner)
  const claimantSubject = `Claim Successful: "${item.title}"`;
  const claimantHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Hello ${claimant.name},</h2>
      <p>You have successfully initiated a claim for <strong>${item.title}</strong>.</p>
      <p>The finder has been notified with your proof of ownership description.</p>
      <hr />
      <h3>Finder Contact Details:</h3>
      <p><strong>Name:</strong> ${reporter.name}</p>
      <p><strong>Email:</strong> ${reporter.email}</p>
      <p><strong>Phone:</strong> ${reporter.phone || 'Not provided'}</p>
      <hr />
      <p>Please contact the finder to retrieve your item.</p>
    </div>
  `;

  try {
    await Promise.all([
      sendEmail(reporter.email, reporterSubject, "Please view HTML version", reporterHtml),
      sendEmail(claimant.email, claimantSubject, "Please view HTML version", claimantHtml)
    ]);
    console.log(`Handover emails sent for item ${item.id}`);
  } catch (error) {
    console.error("Error sending handover emails:", error);
  }
};

// Export all functions (same interface as your original email service)
module.exports = {
  createTransport,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendHandoverEmail,
};




# LAFIMail Integration Guide

## Overview

LAFIMail is an internal email service that replaces traditional SMTP email delivery with HTTP-based messaging. It provides a Gmail-like interface where users can send and receive emails within your application ecosystem.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOST & FOUND APP                             │
│  (Your existing React + Node.js app)                            │
│                                                                 │
│  ┌─────────────────┐     ┌──────────────────────────────┐      │
│  │  lafimail-      │────▶│  HTTP API Calls              │      │
│  │  adapter.js     │     │  (replaces SMTP)             │      │
│  └─────────────────┘     └──────────────┬───────────────┘      │
└─────────────────────────────────────────┼───────────────────────┘
                                          │ HTTP
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAFIMail SERVICE                             │
│  (Next.js App deployed on Render.com)                           │
│                                                                 │
│  ┌─────────────────┐     ┌──────────────────────────────┐      │
│  │  User Mailboxes │     │  REST API                    │      │
│  │  - Inbox        │     │  - POST /api/mail/send       │      │
│  │  - Sent         │     │  - GET  /api/mail/inbox      │      │
│  │  - Trash        │     │  - POST /api/users/create    │      │
│  └─────────────────┘     └──────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Deploying LAFIMail

### Step 1: Set Up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (M0 Sandbox - Free)
3. Create a database user:
   - Username: `lafimail`
   - Password: (generate a strong password)
4. Network Access: Add `0.0.0.0/0` (allow all) for Render.com
5. Get your connection string:
   ```
   mongodb+srv://lafimail:<password>@cluster0.xxxxx.mongodb.net/lafimail?retryWrites=true&w=majority
   ```

### Step 2: Deploy to Render.com

1. Push your LAFIMail code to GitHub
2. Go to [Render.com](https://render.com) and create a free account
3. Create a new Web Service:
   - Connect your GitHub repository
   - Select the repository with LAFIMail
   - Configure:
     - **Name**: `lafimail`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
   - Add Environment Variables:
     ```
     MONGODB_URI=mongodb+srv://lafimail:<password>@cluster0.xxxxx.mongodb.net/lafimail?retryWrites=true&w=majority
     JWT_SECRET=your-random-secret-key-here
     MASTER_API_KEY=your-master-api-key-here
     NEXT_PUBLIC_APP_URL=https://lafimail.onrender.com
     NODE_ENV=production
     ```
4. Deploy!

### Step 3: Create Your Admin Account

1. Visit `https://your-lafimail-app.onrender.com/register`
2. Create your admin account with username (e.g., `admin`)
3. Your email will be `admin@lafimail.internal`

### Step 4: Get Your API Key

You'll need to generate an API key for your Lost & Found app. For now, use the `MASTER_API_KEY` you set in environment variables.

---

## Part 2: Integrating with Lost & Found App

### Step 1: Update Your .env File

Replace your existing email configuration with LAFIMail settings:

```env
# OLD SMTP CONFIGURATION (Remove or comment out)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=465
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password

# NEW LAFIMAIL CONFIGURATION
LAFIMAIL_API_URL=https://your-lafimail-app.onrender.com
LAFIMAIL_API_KEY=your-master-api-key
EMAIL_FROM_NAME=Lost and Found Item
EMAIL_FROM_ADDRESS=noreply@lafimail.internal

# Keep these for email links
CLIENT_URL=https://your-lostandfound-app.onrender.com
VITE_REACT_APP_API_CLIENT_URL=https://your-lostandfound-app.onrender.com
```

### Step 2: Replace Your Email Service

1. Copy `lafimail-adapter.js` to your Lost & Found project:
   ```bash
   cp download/lafimail-adapter.js your-lostandfound-project/utils/emailService.js
   ```

2. Install axios if not already installed:
   ```bash
   npm install axios
   ```

3. Update your imports. Replace:
   ```javascript
   // OLD
   import { sendEmail, sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';
   ```
   With:
   ```javascript
   // NEW - Same interface, different implementation!
   const { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendHandoverEmail } = require('./utils/emailService.js');
   ```

That's it! Your email service now uses HTTP instead of SMTP.

---

## Part 3: User Registration Flow

### Option A: Users Register Separately (Recommended)

1. Users visit your LAFIMail app and register for an email account
2. They get `username@lafimail.internal`
3. When registering on Lost & Found, they use their LAFIMail email
4. Verification emails are delivered to their LAFIMail inbox

### Option B: Automatic Account Creation

You can automatically create LAFIMail accounts when users register on Lost & Found:

```javascript
// In your Lost & Found registration handler
const response = await fetch('https://your-lafimail-app.onrender.com/api/users/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.LAFIMAIL_API_KEY,
  },
  body: JSON.stringify({
    username: desiredUsername,
    password: temporaryPassword,
    email: recoveryEmail, // Optional
    fullName: userFullName,
    generateApiKey: false,
  }),
});

const data = await response.json();
// User now has: username@lafimail.internal
```

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/me` | GET | Get current user |

### Email Operations

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/mail/send` | POST | Session/API Key | Send an email |
| `/api/mail/inbox` | GET | Session | Get inbox messages |
| `/api/mail/sent` | GET | Session | Get sent messages |
| `/api/mail/[id]` | GET | Session | Get specific email |
| `/api/mail/[id]` | PATCH | Session | Update email (read, star, move) |
| `/api/mail/[id]` | DELETE | Session | Delete email |

### User Management (External Apps)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users/create` | POST | Master API Key | Create email account |

---

## Sending Email via API

```javascript
// Send email using API key
const response = await fetch('https://your-lafimail-app.onrender.com/api/mail/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
  },
  body: JSON.stringify({
    to: 'recipient@lafimail.internal',
    subject: 'Hello from Lost & Found',
    text: 'This is a plain text message',
    html: '<p>This is an <strong>HTML</strong> message</p>',
  }),
});
```

---

## Troubleshooting

### Email not delivered to LAFIMail inbox
- Check that the recipient exists in LAFIMail database
- Verify the email format: `username@lafimail.internal`

### API authentication failed
- Ensure you're sending the API key in the `X-API-Key` header
- For external apps, use the `MASTER_API_KEY`
- For user sessions, ensure the auth cookie is set

### MongoDB connection issues
- Check your MongoDB Atlas network settings (allow all IPs)
- Verify connection string format
- Check database user credentials

---

## Security Considerations

1. **API Keys**: Keep your `MASTER_API_KEY` secure and rotate periodically
2. **JWT Secret**: Use a strong, random secret for JWT signing
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Consider adding rate limiting for production use

---

## Future Enhancements

- [ ] File attachments support
- [ ] Email threading/conversations
- [ ] Search functionality
- [ ] Email forwarding to external addresses
- [ ] Push notifications
- [ ] Mobile app

---

## Support

For issues or questions, please check:
1. The browser console for client-side errors
2. Server logs on Render.com
3. MongoDB Atlas logs for database issues






I am thinking of creating an email service with the extention somthing@gikpsmail.com We will use pnpm for all the dependencies that will be installed. prisma and create-vite are already installed globally, you must use them or fix them If they have issues. You must not install prisma project wise. i do not have space and data waste. Mongod is installed locally Which you must use. And as above, i want to integrate this email service to my LAFI appication and also it can be used as an alternative to gemail using https since i will be hosting it on render.com which blocks smpt by default, so we will be using https for everythin. We will use moreden es6 sysntact and javascript all through, not typescript but for the react front end bundled with vite and also for the backend using nodejs. So you may need to refactor the ideas in the above and make a comprehensive plan.dm and also a todo.md we will use vanillar css for the front end. 
