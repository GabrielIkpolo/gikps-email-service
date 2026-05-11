import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/errors.js';
import logger from '../utils/logger.js';
import { z } from 'zod';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long').max(30),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(1, 'Full name is required').max(100).optional(),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export const checkUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    const normalizedUsername = username.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (user) {
      return res.status(200).json({
        status: 'fail',
        data: { available: false },
      });
    }

    res.status(200).json({
      status: 'success',
      data: { available: true },
    });
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    logger.info(`Registration attempt for username: ${req.body.username}`);
    
    const validatedData = registerSchema.parse(req.body);
    const { username, password, email, fullName } = validatedData;

    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      logger.warn(`Registration failed: Username ${normalizedUsername} already taken`);
      return next(new AppError('Username already taken', 400));
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      logger.warn(`Registration failed: Email ${normalizedEmail} already in use`);
      return next(new AppError('Email already in use', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        fullName,
      },
    });

    logger.info(`User registered successfully: ${normalizedUsername} (${newUser.id})`);

    const token = signToken(newUser.id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`Registration validation failed: ${err.errors.map(e => e.message).join(', ')}`);
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    logger.info(`Login attempt for identifier: ${req.body.username}`);

    const validatedData = loginSchema.parse(req.body);
    const { username, password } = validatedData;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() },
        ],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn(`Login failed: Incorrect credentials for identifier: ${username}`);
      return next(new AppError('Incorrect username or password', 401));
    }

    logger.info(`User logged in successfully: ${user.username} (${user.id})`);

    const token = signToken(user.id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`Login validation failed: ${err.errors.map(e => e.message).join(', ')}`);
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      logger.error(`GetMe failed: User with ID ${req.user.id} not found`);
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    logger.info(`Password change attempt for user ID: ${req.user.id}`);
    
    const validatedData = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validatedData;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      logger.warn(`Password change failed: Incorrect current password for user ID: ${req.user.id}`);
      return next(new AppError('Incorrect current password', 401));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    logger.info(`Password changed successfully for user ID: ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      logger.warn(`Password change validation failed: ${err.errors.map(e => e.message).join(', ')}`);
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
};
