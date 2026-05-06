import { Router } from 'express';
import AdvisorController from '../controllers/AdvisorController.js';

import authenticateUser from '../middleware/auth.middleware.js';

const router = Router();

// Route for deep AI analysis - Protected
router.get('/analyze/:symbol', authenticateUser, AdvisorController.getAnalysis);

export default router;
