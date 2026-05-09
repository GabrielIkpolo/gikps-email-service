import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import AppError from '../utils/errors.js';

export const createEmailAccount = async (req, res, next) => {
  try {
    const { username, password, email, fullName } = req.body;

    if (!username || !password || !email) {
      return next(new AppError('Please provide username, password, and email', 400));
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return next(new AppError('Username or email already in use', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName,
      },
    });

    res.status(201).json({
      status: 'success',
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
    next(err);
  }
};
