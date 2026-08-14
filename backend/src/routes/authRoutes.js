import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateApiKey } from '../middleware/apiKey.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.patch('/change-password', authenticate, authController.changePassword);
router.patch('/me', authenticate, authController.updateMe);
router.get('/me', authenticate, authController.getMe);
router.get('/check-username/:username', authController.checkUsername);
// Health check endpoint for adapter - returns minimal info only
router.get('/verify', validateApiKey, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'GikpsMail API is operational'
  });
});

export default router;
