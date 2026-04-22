import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createProgressEntry, getProgressDashboard, updateProgressEntry } from '../controllers/progressController';

export const progressRoutes = Router();

progressRoutes.use(requireAuth);
progressRoutes.get('/', getProgressDashboard);
progressRoutes.post('/', createProgressEntry);
progressRoutes.patch('/:id', updateProgressEntry);
