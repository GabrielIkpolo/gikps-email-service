import express from 'express';
import * as userController from '../controllers/userController.js';
import { validateApiKey } from '../middleware/apiKey.js';

const router = express.Router();

// Programmatic account creation (requires Master API Key)
router.post('/create', validateApiKey, userController.createEmailAccount);

export default router;
