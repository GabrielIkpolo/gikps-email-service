import prisma from '../config/db.js';
import AppError from '../utils/errors.js';
import { uploadFile, deleteFile } from '../utils/storage.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

// Email encryption key (loaded from environment)
const EMAIL_ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Encrypt email content using AES-256-GCM
 */
function encryptContent(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(EMAIL_ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return JSON.stringify({ iv: iv.toString('base64'), data: encrypted, tag: authTag });
}

/**
 * Decrypt email content using AES-256-GCM
 */
function decryptContent(encryptedJson) {
  if (!encryptedJson) return '';
  try {
    const { iv, data, tag } = JSON.parse(encryptedJson);
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(EMAIL_ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    let decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '[Unable to decrypt message]';
  }
}

/**
 * Sanitize email data - remove internal IDs before sending to client
 */
function sanitizeEmail(email) {
  if (!email) return null;
  const { senderId, receiverId, ...sanitized } = email;
  // Remove any raw ID fields that shouldn't be exposed
  sanitized.sender = email.sender ? {
    fullName: email.sender.fullName || 'Unknown',
    username: email.sender.username,
    email: email.sender.email,
  } : null;
  sanitized.receiver = email.receiver ? {
    fullName: email.receiver.fullName || 'Unknown',
    username: email.receiver.username,
    email: email.receiver.email,
  } : null;
  return sanitized;
}

/**
 * Send email via JSON payload (for Nodemailer adapter)
 */
export const sendEmailJson = async (req, res, next) => {
  try {
    const { to, subject, text, html, fromName, fromEmail, attachments } = req.body;

    if (!to || !subject) {
      return next(new AppError('Recipient (to) and Subject are required', 400));
    }

    // For adapter requests (API key auth), we need a system sender
    // For JWT auth, use req.user.id from the authenticate middleware
    let senderId = req.user?.id;
    
    if (!senderId) {
      // API Key auth path: look up or create a system sender user
      // This allows external apps to send emails without JWT tokens
      const systemUser = await prisma.user.findFirst({
        where: { email: 'system@gikpsmail.com' }
      });
      
      if (systemUser) {
        senderId = systemUser.id;
      } else {
        // Create a system user for API-based sends
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash('system-api-key', 10);
        const newUser = await prisma.user.create({
          data: {
            username: 'system_api',
            email: 'system@gikpsmail.com',
            password: hashedPassword,
            fullName: 'System API'
          }
        });
        senderId = newUser.id;
      }
    }

    let processedAttachments = [];
    if (attachments && Array.isArray(attachments)) {
      processedAttachments = attachments.map(att => ({
        url: att.url || '',
        filename: att.filename || 'attachment',
        mimeType: att.mimeType || 'application/octet-stream',
        size: att.size || 0,
      }));
    }

    // Encrypt email content before storing
    const encryptedText = encryptContent(text);
    const encryptedHtml = encryptContent(html);

    const email = await prisma.email.create({
      data: {
        subject,
        text: encryptedText,
        html: encryptedHtml,
        sender: {
          connect: { id: senderId }
        },
        receiver: {
          connect: { email: to.toLowerCase() }
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

    // Emit real-time event with sanitized data
    const io = req.app.get('io');
    if (io) {
      const sanitizedEmail = sanitizeEmail(email);
      io.to(`user_${email.receiverId}`).emit('new-email', {
        type: 'received',
        email: sanitizedEmail
      });
      io.to(`user_${senderId}`).emit('new-email', {
        type: 'sent',
        email: sanitizedEmail
      });
    }

    res.status(201).json({
      status: 'success',
      data: { email: sanitizeEmail(email) },
      messageId: email.id
    });
  } catch (err) {
    if (err.code === 'P2025' || err.code === 'P2023') {
      return next(new AppError('Recipient email address not found in GikpsMail', 404));
    }
    next(err);
  }
};

export const sendEmail = async (req, res, next) => {
  try {
    const { to, subject, text, html, attachments } = req.body;

    if (!to || !subject) {
      return next(new AppError('Recipient (to) and Subject are required', 400));
    }

    const senderId = req.user.id;

    // Handle attachments from multipart form data
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
       processedAttachments = attachments.map(att => ({
         url: att.url || '',
         filename: att.filename || 'attachment',
         mimeType: att.mimeType || 'application/octet-stream',
         size: att.size || 0,
       }));
    }

    // Encrypt email content before storing
    const encryptedText = encryptContent(text);
    const encryptedHtml = encryptContent(html);

    const email = await prisma.email.create({
      data: {
        subject,
        text: encryptedText,
        html: encryptedHtml,
        sender: {
          connect: { id: senderId }
        },
        receiver: {
          connect: { email: to.toLowerCase() }
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

    // Emit real-time event with sanitized data
    const io = req.app.get('io');
    if (io) {
      const sanitizedEmail = sanitizeEmail(email);
      io.to(`user_${email.receiverId}`).emit('new-email', {
        type: 'received',
        email: sanitizedEmail
      });
      io.to(`user_${senderId}`).emit('new-email', {
        type: 'sent',
        email: sanitizedEmail
      });
    }

    res.status(201).json({
      status: 'success',
      data: { email: sanitizeEmail(email) }
    });
  } catch (err) {
    if (err.code === 'P2025' || err.code === 'P2023') {
      return next(new AppError('Recipient email address not found in GikpsMail', 404));
    }
    next(err);
  }
};

/**
 * Decrypt and sanitize an email for client display
 */
function decryptAndSanitizeEmail(email) {
  if (!email) return null;
  const { senderId, receiverId, ...rest } = email;
  return {
    ...rest,
    text: decryptContent(rest.text),
    html: decryptContent(rest.html),
    sender: email.sender ? {
      fullName: email.sender.fullName || 'Unknown',
      username: email.sender.username,
      email: email.sender.email,
    } : null,
  };
}

export const getInbox = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    const whereClause = search 
      ? {
          AND: [
            { receiverId: userId },
            {
              OR: [
                { subject: { contains: search, mode: 'insensitive' } },
                { sender: { email: { contains: search, mode: 'insensitive' } } },
                { sender: { fullName: { contains: search, mode: 'insensitive' } } },
              ]
            }
          ]
        }
      : { receiverId: userId };

    const emails = await prisma.email.findMany({
      where: whereClause,
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

    const sanitizedEmails = emails.map(decryptAndSanitizeEmail);

    res.status(200).json({
      status: 'success',
      results: sanitizedEmails.length,
      data: { emails: sanitizedEmails }
    });
  } catch (err) {
    next(err);
  }
};

export const getSent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    const whereClause = search 
      ? {
          AND: [
            { senderId: userId },
            {
              OR: [
                { subject: { contains: search, mode: 'insensitive' } },
                { receiver: { email: { contains: search, mode: 'insensitive' } } },
                { receiver: { fullName: { contains: search, mode: 'insensitive' } } },
              ]
            }
          ]
        }
      : { senderId: userId };

    const emails = await prisma.email.findMany({
      where: whereClause,
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

    const sanitizedEmails = emails.map(decryptAndSanitizeEmail);

    res.status(200).json({
      status: 'success',
      results: sanitizedEmails.length,
      data: { emails: sanitizedEmails }
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

    const sanitizedEmail = decryptAndSanitizeEmail(email);

    res.status(200).json({
      status: 'success',
      data: { email: sanitizedEmail }
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
      // First, delete the actual files
      for (const attachment of email.attachments) {
        try {
          await deleteFile(attachment);
        } catch (fileErr) {
          // If file deletion fails, we still want to continue and delete from DB
          // but we should log it.
          log.error(`Failed to delete attachment file ${attachment.filename}: ${fileErr.message}`);
        }
      }

      // Then, delete the attachment records from the database
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