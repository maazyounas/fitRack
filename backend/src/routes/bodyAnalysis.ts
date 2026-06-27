import { Router } from 'express';
import {
  getOnboardingData,
  saveBodyAnalysis,
  getBodyAnalysisHistory,
  deleteBodyAnalysisData,
  saveOnboardingData,
} from '../controllers/bodyAnalysisController';

/**
 * Body Analysis Routes
 * Base: /api/body-analysis
 *
 * All routes require JWT authentication via the `authenticate` middleware
 * imported from the shared auth middleware.
 */

// Import the existing auth middleware
import { requireAuth } from '../middleware/auth';

const router = Router();

// Save a completed analysis (only if user consented to storage)
router.post('/save', requireAuth, saveBodyAnalysis);

// Paginated scan history: GET /api/body-analysis/history?page=1&limit=10
router.get('/history', requireAuth, getBodyAnalysisHistory);

// GDPR right-to-erasure: DELETE /api/body-analysis/data
router.delete('/data', requireAuth, deleteBodyAnalysisData);

// Save onboarding selections
router.post('/onboarding', requireAuth, saveOnboardingData);
router.get('/onboarding', requireAuth, getOnboardingData);

export default router;
