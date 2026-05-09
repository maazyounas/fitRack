import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { 
  createProgressEntry, 
  getProgressDashboard, 
  updateProgressEntry,
  getProgressCharts,
  getMilestones,
  postStreak
} from '../controllers/progressController';

export const progressRoutes = Router();

progressRoutes.use(requireAuth);
progressRoutes.get('/', getProgressDashboard);
progressRoutes.post('/', createProgressEntry);
progressRoutes.get('/charts', getProgressCharts);
progressRoutes.get('/milestones', getMilestones);
progressRoutes.post('/streak', postStreak);
progressRoutes.patch('/:id', updateProgressEntry);
