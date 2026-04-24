import { Router } from 'express';
import AdvisorController from '../controllers/AdvisorController.js';

const router = Router();

// Route for deep AI analysis
router.get('/analyze/:symbol', AdvisorController.getAnalysis);

export default router;
