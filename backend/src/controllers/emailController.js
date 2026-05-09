import prisma from '../config/db.js';
import AppError from '../utils/errors.js';
import { uploadFile } from '../utils/storage.js';

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
        to: to, // In a real system, this would be a User ID or a validated email address
        subject,
        text,
        html,
        senderId,
        // For now, we'll find the receiver by email address (simplified)
        // In production, we'd resolve the email to a User ID
        receiver: {
          connect: { email: to }
        },
        attachments: {
          create: processedAttachments
        }
      },
      include: {
        attachments: true
      }
    });

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
      include: { attachments: true }
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
      include: { attachments: true }
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
      include: { attachments: true }
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

    await prisma.email.delete({
      where: { id }
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
