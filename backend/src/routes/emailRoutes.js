import express from 'express';
import * as emailController from '../controllers/emailController.js';
import { authenticate } from '../middleware/auth.js';
import { validateApiKey } from '../middleware/apiKey.js';
import multer from 'multer';

const router = express.Router();

// Configure multer with memory storage and error handling
// Using memoryStorage so files are available as buffers (works on Render)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 5, // Max 5 files per request
  },
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('[GikpsMail] Multer error:', err.message);
    return res.status(400).json({
      status: 'error',
      error: `File upload error: ${err.message}`,
    });
  }
  next();
};

// JSON endpoint for Nodemailer adapter - must come BEFORE authenticate middleware
// Uses API key auth instead of JWT so external apps can send emails
router.post('/send-json', validateApiKey, emailController.sendEmailJson);

// All other routes require JWT authentication
router.use(authenticate);

// Original endpoint for frontend (multipart/form-data)
// Multer error handling is wrapped in the controller
router.post('/send', upload.array('attachments'), (req, res, next) => {
  // Log incoming file count for debugging
  console.log(`[GikpsMail] Received ${req.files?.length || 0} file(s), body keys:`, Object.keys(req.body));
  emailController.sendEmail(req, res, next);
}, handleMulterError);

router.get('/inbox', emailController.getInbox);
router.get('/sent', emailController.getSent);
router.get('/:id', emailController.getEmail);
router.patch('/:id', emailController.updateEmailStatus);
router.delete('/:id', emailController.deleteEmail);

export default router;