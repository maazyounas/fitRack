import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createWorkoutFromTemplate,
  createWorkoutPlan,
  deleteWorkoutPlan,
  getWorkoutAiReview,
  getWorkoutPlan,
  listWorkoutPlans,
  listWorkoutTemplates,
  markWorkoutCompleted,
  scheduleWorkoutPlan,
  updateWorkoutPlan,
} from '../controllers/workoutController';

export const workoutRoutes = Router();

workoutRoutes.use(requireAuth);
workoutRoutes.get('/templates', listWorkoutTemplates);
workoutRoutes.post('/templates/use', createWorkoutFromTemplate);
workoutRoutes.get('/', listWorkoutPlans);
workoutRoutes.post('/', createWorkoutPlan);
workoutRoutes.get('/:id', getWorkoutPlan);
workoutRoutes.patch('/:id', updateWorkoutPlan);
workoutRoutes.delete('/:id', deleteWorkoutPlan);
workoutRoutes.post('/:id/schedule', scheduleWorkoutPlan);
workoutRoutes.post('/:id/complete', markWorkoutCompleted);
workoutRoutes.get('/:id/ai-review', getWorkoutAiReview);
