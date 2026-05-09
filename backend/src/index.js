import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import AppError from './utils/errors.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", // In production, specify the frontend URL
    methods: ["GET", "POST"]
  }
});

// Attach io to app so it can be accessed in controllers via req.app.get('io')
app.set('io', io);

app.use(cors());
app.use(express.json());

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

  logger.error(`${err.status.toUpperCase()} ${err.statusCode}: ${err.message}`);

  res.status(err.statusCode).json({
    status: err.status,
    error: err.message,
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`App running on port ${PORT}...`);
});
