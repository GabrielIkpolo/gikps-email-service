import express from 'express';
import * as emailController from '../controllers/emailController.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.post('/send', upload.array('attachments'), emailController.sendEmail);
router.get('/inbox', emailController.getInbox);
router.get('/sent', emailController.getSent);
router.get('/:id', emailController.getEmail);
router.patch('/:id', emailController.updateEmailStatus);
router.delete('/:id', emailController.deleteEmail);

export default router;
