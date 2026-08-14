// CRITICAL: Create logs directory BEFORE any imports that might use it
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit'; // DISABLED - causing deployment issues
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import AppError from './utils/errors.js';
import logger from './utils/logger.js';
import prisma from './config/db.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.set('trust proxy', false);


// Security: Helmet sets secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Rate limiting - DISABLED FOR NOW (causing deployment issues)
// TODO: Re-enable with proper configuration after debugging

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { status: 'error', error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 'error', error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: { status: 'error', error: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: { status: 'error', error: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', resetLimiter);
app.use('/api/auth/reset-password', resetLimiter);
app.use(generalLimiter);


// Serve static files (for attachments in development)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Initialize Socket.io with restricted CORS
// IMPORTANT: Add ALLOWED_ORIGINS to Render env vars for production!
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://gikps-email-service.onrender.com,https://gikps-email-service-1.onrender.com')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// CORS with restricted origins
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Request Logging Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`Socket ${socket.id} joined room: user_${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Attach io to app so it can be accessed in controllers
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mail', emailRoutes);

// 404 Handler
app.use((req, res, next) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  logger.warn(error.message);
  next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Use logger if available, otherwise fallback to console
  const log = (typeof logger !== 'undefined') ? logger : console;
  
  log.error(`${err.status.toUpperCase()} ${err.statusCode}: ${err.message}`);

  res.status(err.statusCode).json({
    status: err.status,
    error: err.message,
  });
});

// Test MongoDB connection before starting server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ MongoDB connected successfully');
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`🚀 App running on port ${PORT}...`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (err) {
    logger.error('❌ Failed to connect to MongoDB:', err.message);
    logger.error('Server cannot start without database connection.');
    process.exit(1);
  }
}

startServer();
