# 📧 GikpsMail Service

**GikpsMail is a drop-in Nodemailer replacement designed for platforms like Render.com where SMTP traffic is blocked.** It provides a plug-and-play HTTP-based email service that works exactly like Nodemailer, enabling seamless integration into any Node.js application.

## 🎯 Why GikpsMail?

Render.com and similar platforms **block traditional SMTP ports (25, 465, 587)**, making it impossible to use libraries like `nodemailer` with standard email providers (SendGrid, Mailgun, AWS SES, etc.). GikpsMail solves this by:

1. **Using HTTPS instead of SMTP** — All emails are sent via REST API calls
2. **Nodemailer-compatible interface** — Replace `nodemailer.createTransport()` with one line
3. **Plug-and-play integration** — Works for email verification, password resets, alerts, and any transactional email use case

## ✨ Key Features

- **🚀 HTTP-Based Delivery**: Bypasses SMTP restrictions using high-speed HTTPS requests
- **📦 Hybrid Storage Strategy**: 
  - **Development**: Local filesystem storage for zero-latency and offline capability
  - **Production**: Fully integrated with **Cloudinary** for scalable, CDN-backed attachment management
- **🛠️ Nodemailer-Compatible Adapter**: Drop-in `gikpsmail-adapter.js` that mimics the exact `nodemailer.createTransport()` interface
- **🎨 Premium Web Client**: Polished React dashboard for managing inboxes, sent mail, and attachments
- **🔒 Secure by Design**: JWT-based authentication, AES-256-GCM email encryption, Master API Key protection
- **🏗️ Modern Stack**: Built with `pnpm`, Node.js (ES6+), React (Vite), Prisma (ORM), MongoDB

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES6+) |
| Package Manager | `pnpm` |
| Frontend | React.js (Vite), Vanilla CSS, React Icons |
| Backend | Express.js |
| Database | MongoDB (via Prisma ORM) |
| Media Storage | Cloudinary (Production) / Local Filesystem (Development) |
| Authentication | JWT + Master API Key |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A running MongoDB instance (local or Atlas)
- Cloudinary account (for production file uploads)

### 1. Installation

```bash
# From the project root
pnpm install
```

### 2. Configuration

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=3001
NODE_ENV=development
APP_URL=http://localhost:3001

# Database
DATABASE_URL="mongodb://localhost:27017/gikpsmail"

# Security
JWT_SECRET="your_super_secret_jwt_key_at_least_32_chars"
MASTER_API_KEY="your_master_api_key_for_external_apps"
EMAIL_ENCRYPTION_KEY="64_hex_characters_for_aes256_gcm"

# Cloudinary (Required for production file uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# CORS (Frontend URL)
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.onrender.com
```

### 3. Database Setup

```bash
cd backend
pnpm prisma generate
pnpm prisma db push   # Creates tables in MongoDB
```

### 4. Running the Project

**Terminal 1 — Backend:**
```bash
cd backend
pnpm dev
# Server runs on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
pnpm dev
# App runs on http://localhost:5173
```

---

## 🔌 Integration Guide (Nodemailer Adapter)

This is the **core feature** of GikpsMail. Use it in ANY Node.js application as a direct replacement for Nodemailer.

### Step 1: Copy the Adapter

Copy `gikpsmail-adapter.js` to your project:
```bash
cp ../custom-email-service/gikpsmail-adapter.js ./utils/gikpsmail-adapter.js
```

### Step 2: Configure Environment Variables

Add these to your application's `.env`:
```env
GIKPSMAIL_API_URL=https://gikps-email-service.onrender.com
GIKPSMAIL_API_KEY=your-master-api-key-here
EMAIL_FROM_NAME="Your App Name"
EMAIL_FROM_ADDRESS=noreply@yourapp.com
```

### Step 3: Use It Like Nodemailer

```javascript
import { createTransport } from './utils/gikpsmail-adapter.js';

// Create transport (same API as nodemailer.createTransport())
const transporter = createTransport({
  host: process.env.GIKPSMAIL_API_URL,
  auth: {
    api_key: process.env.GIKPSMAIL_API_KEY,
    fromName: process.env.EMAIL_FROM_NAME,
    fromAddress: process.env.EMAIL_FROM_ADDRESS,
  },
  timeout: 30000, // Optional: request timeout in ms (default: 30s)
});

// Verify connection (optional)
const isVerified = await transporter.verify();
console.log('Transport ready:', isVerified);

// Send email — same API as nodemailer!
await transporter.sendMail({
  from: '"My App" <noreply@yourapp.com>',
  to: 'user@example.com',
  subject: 'Welcome to My App!',
  text: 'Hello! Welcome aboard.',
  html: '<h1>Welcome!</h1><p>Hello! Welcome aboard.</p>'
});

// Send with attachments (base64 encoded)
await transporter.sendMail({
  from: '"My App" <noreply@yourapp.com>',
  to: 'user@example.com',
  subject: 'Document Attached',
  text: 'Please find the document attached.',
  html: '<p>Please find the document attached.</p>',
  attachments: [{
    filename: 'document.pdf',
    content: base64EncodedPdfString,
    contentType: 'application/pdf',
  }]
});

// Close transport (no-op for HTTP)
await transporter.close();
```

### Common Use Cases

#### Email Verification
```javascript
const verifyToken = crypto.randomBytes(32).toString('hex');
// Save token to your database...

await transporter.sendMail({
  from: '"My App" <noreply@yourapp.com>',
  to: user.email,
  subject: 'Verify Your Email',
  html: `
    <h1>Verify Your Email</h1>
    <p>Click the link below to verify your email:</p>
    <a href="https://myapp.com/verify?token=${verifyToken}">Verify Now</a>
  `
});
```

#### Password Reset
```javascript
const resetToken = crypto.randomBytes(32).toString('hex');
// Save token to your database with expiry...

await transporter.sendMail({
  from: '"My App" <noreply@yourapp.com>',
  to: user.email,
  subject: 'Reset Your Password',
  html: `
    <h1>Password Reset</h1>
    <p>Click the link below to reset your password:</p>
    <a href="https://myapp.com/reset?token=${resetToken}">Reset Password</a>
    <p>This link expires in 1 hour.</p>
  `
});
```

#### Transactional Alerts
```javascript
await transporter.sendMail({
  from: '"My App Notifications" <alerts@yourapp.com>',
  to: user.email,
  subject: 'Order #12345 Shipped!',
  html: `
    <h1>Your Order Has Shipped!</h1>
    <p>Track your package: <a href="https://tracking.example.com/ABC123">Here</a></p>
  `,
  attachments: [{
    filename: 'receipt.pdf',
    content: receiptBuffer.toString('base64'),
    contentType: 'application/pdf',
  }]
});
```

### Adapter API Reference

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `host` | string | GikpsMail API URL | From env var |
| `auth.api_key` | string | Master API Key | From env var |
| `auth.fromName` | string | Default sender name | 'GikpsMail Service' |
| `auth.fromAddress` | string | Default from address | 'noreply@gikpsmail.com' |
| `timeout` | number | Request timeout (ms) | 30000 |

### Nodemailer-Compatible Methods

- **`transporter.sendMail(options)`** — Send an email. Returns `{ messageId, accepted, rejected }`
- **`transporter.verify()`** — Verify configuration. Returns `boolean`
- **`transporter.close()`** — Close transport (no-op for HTTP). Returns `Promise<void>`

---

## 🌐 Deployment on Render

### Backend Setup

1. Create a new **Web Service** on Render
2. Connect your repository
3. Configure:
   - **Build Command**: `cd backend && pnpm install`
   - **Start Command**: `cd backend && pnpm start`
   - **Instance Type**: Free (or Paid for production)

### Environment Variables (Render Dashboard)

```env
NODE_ENV=production
PORT=3001
APP_URL=https://your-app.onrender.com
RENDER_APP_URL=https://your-app.onrender.com
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="your-super-secret-jwt-key"
MASTER_API_KEY="your-master-api-key"
EMAIL_ENCRYPTION_KEY="64-hex-char-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
ALLOWED_ORIGINS=https://your-frontend.onrender.com
```

### Frontend Setup

1. Create a new **Static Site** on Render
2. Configure:
   - **Build Command**: `cd frontend && pnpm install`
   - **Publish Directory**: `dist`
3. Add environment variable:
   ```env
   VITE_API_URL=https://your-backend.onrender.com/api
   ```

---

## 🛡️ Security Considerations

- **API Key Protection**: Never expose your `MASTER_API_KEY` in client-side code
- **Environment Variables**: Always use `.env` files; never commit secrets to version control
- **Email Encryption**: All email content is encrypted at rest using AES-256-GCM
- **Rate Limiting**: Built-in rate limiting protects against abuse (100 req/15min general, 10 req/15min auth)
- **Helmet Headers**: Security headers configured automatically

---

## 📁 Project Structure

```
custom-email-service/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── config/db.js        # MongoDB connection
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, validation
│   │   ├── routes/             # API routes
│   │   ├── utils/              # Storage, errors, logger
│   │   └── index.js            # Server entry point
├── frontend/                   # React dashboard
│   ├── src/
│   │   ├── api/                # API client
│   │   ├── components/         # Reusable UI
│   │   ├── pages/              # Route pages
│   │   └── context/            # Auth, Theme contexts
├── gikpsmail-adapter.js        # Nodemailer adapter (copy to your projects)
├── INTEGRATION_GUIDE.md        # Detailed integration documentation
└── README.md                   # This file
```

---

## 📜 License

This project is licensed under the ISC License.
