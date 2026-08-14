import express from 'express';
import * as emailController from '../controllers/emailController.js';
import { authenticate } from '../middleware/auth.js';
import { validateApiKey } from '../middleware/apiKey.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// Original endpoint for frontend (multipart/form-data)
router.post('/send', upload.array('attachments'), emailController.sendEmail);

// JSON endpoint for Nodemailer adapter compatibility
router.post('/send-json', emailController.sendEmailJson);

router.get('/inbox', emailController.getInbox);
router.get('/sent', emailController.getSent);
router.get('/:id', emailController.getEmail);
router.patch('/:id', emailController.updateEmailStatus);
router.delete('/:id', emailController.deleteEmail);

export default router;