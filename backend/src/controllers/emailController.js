import prisma from '../config/db.js';
import AppError from '../utils/errors.js';
import { uploadFile } from '../utils/storage.js';
import logger from '../utils/logger.js';

export const sendEmail = async (req, res, next) => {
  try {
    const { to, subject, text, html, attachments } = req.body;

    if (!to || !subject) {
      return next(new AppError('Recipient (to) and Subject are required', 400));
    }

    // For simplicity in this initial implementation, we assume the sender is the authenticated user
    const senderId = req.user.id;

    // Handle attachments if they were uploaded via a separate step or provided as URLs
    // In a real multipart/form-data request, attachments would come from req.files
    let processedAttachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadFile(file);
        processedAttachments.push({
          url: uploaded.url,
          filename: uploaded.filename,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
        });
      }
    }

    // If attachments are passed as an array of objects (e.g., from the adapter)
    if (attachments && Array.isArray(attachments)) {
       processedAttachments = attachments;
    }

    const email = await prisma.email.create({
      data: {
        subject,
        text,
        html,
        sender: {
          connect: { id: senderId }
        },
        receiver: {
          connect: { email: to }
        },
        attachments: {
          create: processedAttachments
        }
      },
      include: {
        attachments: true,
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      // Notify the receiver
      io.to(`user_${email.receiverId}`).emit('new-email', {
        type: 'received',
        email
      });
      
      // Also notify the sender (for 'Sent' view updates)
      io.to(`user_${senderId}`).emit('new-email', {
        type: 'sent',
        email
      });
    }

    res.status(201).json({
      status: 'success',
      data: { email }
    });
  } catch (err) {
    // Handle case where receiver doesn't exist in DB
    if (err.code === 'P2025') {
      return next(new AppError('Recipient email address not found in GikpsMail', 404));
    }
    next(err);
  }
};

export const getInbox = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const emails = await prisma.email.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      include: { 
        attachments: true,
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      status: 'success',
      results: emails.length,
      data: { emails }
    });
  } catch (err) {
    next(err);
  }
};

export const getSent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const emails = await prisma.email.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' },
      include: { 
        attachments: true,
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      status: 'success',
      results: emails.length,
      data: { emails }
    });
  } catch (err) {
    next(err);
  }
};

export const getEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const email = await prisma.email.findFirst({
      where: {
        OR: [
          { id, senderId: userId },
          { id, receiverId: userId }
        ]
      },
      include: { 
        attachments: true,
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!email) {
      return next(new AppError('No email found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { email }
    });
  } catch (err) {
    next(err);
  }
};

export const updateEmailStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isRead, isStarred } = req.body;
    const userId = req.user.id;

    const email = await prisma.email.findFirst({
      where: {
        OR: [
          { id, senderId: userId },
          { id, receiverId: userId }
        ]
      }
    });

    if (!email) {
      return next(new AppError('No email found with that ID', 404));
    }

    await prisma.email.update({
      where: { id },
      data: {
        isRead: isRead !== undefined ? isRead : email.isRead,
        isStarred: isStarred !== undefined ? isStarred : email.isStarred,
      }
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const deleteEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const log = (typeof logger !== 'undefined') ? logger : console;
    log.info(`Attempting to delete email with ID: ${id} by user: ${userId}`);

    const email = await prisma.email.findFirst({
      where: {
        OR: [
          { id, senderId: userId },
          { id, receiverId: userId }
        ]
      },
      include: { attachments: true }
    });

    if (!email) {
      log.warn(`Delete failed: Email with ID ${id} not found or unauthorized for user ${userId}`);
      return next(new AppError('No email found with that ID', 404));
    }

    // Manually delete attachments first to avoid Prisma relation errors in MongoDB
    if (email.attachments && email.attachments.length > 0) {
      await prisma.attachment.deleteMany({
        where: { emailId: id }
      });
    }

    await prisma.email.delete({
      where: { id }
    });

    log.info(`Email with ID ${id} deleted successfully by user ${userId}`);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    const log = (typeof logger !== 'undefined') ? logger : console;
    log.error(`Error deleting email ${req.params.id}: ${err.message}`);
    next(err);
  }
};