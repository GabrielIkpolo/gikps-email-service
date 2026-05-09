import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateApiKey } from '../middleware/apiKey.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.getMe);
router.get('/verify', validateApiKey, authController.getMe); // Added for adapter verification

export default router;
