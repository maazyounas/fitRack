import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createWorkoutSchema, updateWorkoutSchema } from '../schemas/workoutSchemas';
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
  refreshWorkoutAiReview,
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
workoutRoutes.post('/', validate(createWorkoutSchema), createWorkoutPlan);
workoutRoutes.get('/:id', getWorkoutPlan);
workoutRoutes.patch('/:id', validate(updateWorkoutSchema), updateWorkoutPlan);
workoutRoutes.put('/:id/exercises', reorderExercises);
workoutRoutes.delete('/:id', deleteWorkoutPlan);
workoutRoutes.post('/:id/schedule', scheduleWorkoutPlan);
workoutRoutes.put('/:id/schedule', updateWeeklySchedule);
workoutRoutes.post('/:id/complete', markWorkoutCompleted);
workoutRoutes.get('/:id/ai-review', getWorkoutAiReview);
workoutRoutes.post('/:id/ai-review', refreshWorkoutAiReview);
