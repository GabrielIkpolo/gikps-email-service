# 📧 GikpsMail Service

GikpsMail is a professional, high-performance, HTTP-based email service designed as a modern alternative to traditional SMTP. It is specifically architected for deployment on platforms like Render.com where SMTP traffic might be restricted, providing a reliable and scalable way to handle transactional and user-facing emails via RESTful APIs.

## ✨ Key Features

- **🚀 HTTP-Based Delivery**: Bypasses SMTP restrictions using high-speed HTTPS requests.
- **📦 Hybrid Storage Strategy**: 
  - **Development**: Local filesystem storage for zero-latency and offline capability.
  - **Production**: Fully integrated with **Cloudinary** for scalable, CDN-backed attachment management.
- **🛠️ Nodemailer-Compatible**: Includes a drop-in `gikpsmail-adapter.js` that mimics the `nodemailer` interface, making integration into existing Node.js apps seamless.
- **🎨 Premium Web Client**: A polished, production-ready React dashboard for managing inboxes, sent mail, and attachments.
- **🔒 Secure by Design**: JWT-based authentication and Master API Key protection for programmatic access.
- **🏗️ Modern Stack**: Built with `pnpm`, Node.js (ES6+), React (Vite), Prisma (ORM), and MongoDB.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES6+)
- **Package Manager**: `pnpm`
- **Frontend**: React.js (Vite), Vanilla CSS, React Icons
- **Backend**: Express.js
- **Database**: MongoDB (via Prisma ORM)
- **Media Storage**: Cloudinary (Production) / Local Filesystem (Development)
- **Authentication**: JWT (JSON Web Tokens)

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- A running MongoDB instance (local or Atlas)
- Cloudinary account (for production)

### 1. Installation

Clone the repository and install dependencies using `pnpm`:

```bash
# From the project root
pnpm install
```

### 2. Configuration

Create a `.env` file in the `backend` directory:

```env
# MongoDB Connection
DATABASE_URL="mongodb://localhost:27017/gikpsmail"

# Security
JWT_SECRET="your_super_secret_jwt_key"
MASTER_API_KEY="your_master_api_key_for_external_apps"

# Server
PORT=3001
APP_URL="http://localhost:3001"

# Cloudinary (Required for production)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 3. Database Setup

Initialize the database schema with Prisma:

```bash
cd backend
pnpm prisma generate
```

### 4. Running the Project

In one terminal, start the backend:

```bash
cd backend
pnpm dev
```

In another terminal, start the frontend:

```bash
cd frontend
pnpm dev
```

---

## 🔌 Integration Guide (Nodemailer Adapter)

GikpsMail provides an adapter that allows you to use it just like `nodemailer`.

### Example Usage

1. Copy `frontend/src/utils/gikpsmail-adapter.js` to your project's `utils/` directory.
2. Update your `.env` with the GikpsMail credentials.

```javascript
import { createTransport } from './utils/gikpsmail-adapter.js';

const transporter = createTransport({
  host: 'http://your-gikpsmail-api.com',
  auth: {
    api_key: 'your-master-api-key'
  }
});

// Usage is identical to Nodemailer
await transporter.sendMail({
  from: '"System" <noreply@gikpsmail.com>',
  to: 'user@example.com',
  subject: 'Hello from GikpsMail!',
  text: 'This was sent via HTTP instead of SMTP!'
});
```

---

## 🛡️ Security Considerations

- **API Key Protection**: Always keep your `MASTER_API_KEY` secret. It allows programmatic creation of email accounts.
- **Environment Variables**: Never commit your `.env` file to version control.
- **Rate Limiting**: For production, it is highly recommended to add rate-limiting middleware to the Express backend.

## 📜 License

This project is licensed under the ISC License.
