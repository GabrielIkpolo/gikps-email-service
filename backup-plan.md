# Project Plan: GikpsMail Service

## Overview
GikpsMail is a custom email service designed to work over HTTPS, providing an alternative to SMTP-based email delivery. This is particularly useful for hosting on platforms like Render.com which may restrict SMTP traffic. The service will allow users to have email addresses ending in `@gikpsmail.com` and provides a web interface to manage these emails. 

The service will prioritize reliability for critical transactional emails (registration, password resets) and provide a polished, professional-grade web interface.

## Architecture

The project will follow a client-server architecture:
- **Backend**: Node.js with Express.js, using Prisma as an ORM for MongoDB.
- **Frontend**: React.js (via Vite) for a web-based email client.
- **Database**: MongoDB (running locally).
- **Storage Strategy (Hybrid)**:
    - **Local Development**: Files are stored in a local directory on the server for speed and ease of use.
    - **Production**: Files are stored on **Cloudinary** for scalability and performance.
- **Protocol**: RESTful API over HTTPS for all communications.
- **Adapter**: A specialized `HTTPTransporter` (mimicking the Nodemailer interface) to allow other applications to send emails via the GikpsMail API as a drop-in replacement.

## Technical Stack
- **Package Manager**: `pnpm`
- **Runtime**: Node.js (ES6+ syntax)
- **Backend Framework**: Express.js
- **Frontend Framework**: React (Vite, JavaScript only)
- **ORM**: Prisma (using global installation)
- **Database**: MongoDB (local instance)
- **Media Storage**: Cloudinary (Production) / Local Filesystem (Development)
- **Styling**: Vanilla CSS (Modern, polished, and professional design system)
- **Authentication**: JWT (JSON Web Tokens)

## Development Phases

### Phase 1: Foundation & Backend Setup
1. Initialize project structure with `pnpm`.
2. Configure MongoDB connection and Prisma schema.
3. Implement User Authentication (Register, Login, JWT).
4. Implement User Management API (for programmatic account creation).

### Phase 2: Mail Core Implementation
1. Implement Mail Schema (Messages, Folders/Labels, Attachments).
2. **Implement Hybrid Storage Utility**: Create a service that switches between local filesystem and Cloudinary based on `NODE_ENV`.
3. Integrate Cloudinary for production attachment storage.
4. Develop Mail API endpoints:
    - `POST /api/mail/send`: Send an email (supporting multipart/form-data for attachments).
    - `GET  /api/mail/inbox`: Retrieve incoming mail.
    - `GET  /api/mail/sent`: Retrieve sent mail.
    - `GET  /api/mail/:id`: Retrieve specific message details (including attachment links).
    - `PATCH /api/mail/:id`: Update email (read, star, move, delete).
    - `DELETE /api/mail/:id`: Delete a message.

### Phase 3: Frontend Development (The Mail Client)
1. Set up Vite + React project.
2. Implement Authentication UI (Login/Register).
3. Build the Main Dashboard (Sidebar with folders, Message list, Reading pane) with a professional, premium feel.
4. Implement Email Composition UI with attachment upload capabilities.
5. Implement Attachment Preview and Download in the reading pane.
6. Apply styling using Vanilla CSS (focus on fluid animations, sophisticated color palettes, and responsiveness).

### Phase 4: Integration & Adapter (Nodemailer-Compatible)
1. Develop the `gikpsmail-adapter.js` to provide a drop-in replacement for `nodemailer`.
2. Implement `createTransport(config)` which returns an object with:
    - `sendMail(mailOptions)`: Mimics Nodemailer's method, supporting `from`, `to`, `subject`, `text`, `html`, and `attachments`.
    - `verify()`: Mimics Nodemailer's method to check connection/API key.
3. Ensure the adapter uses the following environment variables (or similar):
    - `GIKPSMAIL_API_URL`
    - `GIKPSMAIL_API_KEY`
    - `EMAIL_FROM_NAME`
    - `EMAIL_FROM_ADDRESS`
4. Test the adapter with a mock application to ensure seamless integration.

### Phase 5: Final Polish & Documentation
1. Final testing of all API endpoints and attachment flows.
2. Refine UI/UX, animations, and micro-interactions.
3. Complete README and deployment instructions.

## Deployment Strategy
- **Backend**: Deploy to Render.com.
- **Frontend**: Deploy to Render.com or Vercel.
- **Database**: Use MongoDB Atlas (or a remote MongoDB instance) for production.
- **Storage**: Use Cloudinary for production attachments.
- **Communication**: All traffic via HTTPS.
