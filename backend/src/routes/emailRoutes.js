import express from 'express';
import * as emailController from '../controllers/emailController.js';
import { authenticate } from '../middleware/auth.js';
import { validateApiKey } from '../middleware/apiKey.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// JSON endpoint for Nodemailer adapter - must come BEFORE authenticate middleware
// Uses API key auth instead of JWT so external apps can send emails
router.post('/send-json', validateApiKey, emailController.sendEmailJson);

// All other routes require JWT authentication
router.use(authenticate);

// Original endpoint for frontend (multipart/form-data)
router.post('/send', upload.array('attachments'), emailController.sendEmail);

router.get('/inbox', emailController.getInbox);
router.get('/sent', emailController.getSent);
router.get('/:id', emailController.getEmail);
router.patch('/:id', emailController.updateEmailStatus);
router.delete('/:id', emailController.deleteEmail);

export default router;