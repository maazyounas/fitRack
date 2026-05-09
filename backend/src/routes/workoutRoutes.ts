import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createWorkoutFromTemplate,
  createWorkoutPlan,
  deleteWorkoutPlan,
  getCurrentWorkoutPlan,
  getWorkoutAiReview,
  getWorkoutPlan,
  listWorkoutPlans,
  listWorkoutTemplates,
  markWorkoutCompleted,
  reorderExercises,
  scheduleWorkoutPlan,
  updateWeeklySchedule,
  updateWorkoutPlan,
} from '../controllers/workoutController';

export const workoutRoutes = Router();

workoutRoutes.use(requireAuth);
workoutRoutes.get('/templates', listWorkoutTemplates);
workoutRoutes.post('/templates/use', createWorkoutFromTemplate);
workoutRoutes.get('/current', getCurrentWorkoutPlan);
workoutRoutes.get('/', listWorkoutPlans);
workoutRoutes.post('/', createWorkoutPlan);
workoutRoutes.get('/:id', getWorkoutPlan);
workoutRoutes.patch('/:id', updateWorkoutPlan);
workoutRoutes.put('/:id/exercises', reorderExercises);
workoutRoutes.delete('/:id', deleteWorkoutPlan);
workoutRoutes.post('/:id/schedule', scheduleWorkoutPlan);
workoutRoutes.put('/:id/schedule', updateWeeklySchedule);
workoutRoutes.post('/:id/complete', markWorkoutCompleted);
workoutRoutes.get('/:id/ai-review', getWorkoutAiReview);
