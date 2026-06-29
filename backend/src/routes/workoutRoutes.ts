import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createWorkoutSchema, updateWorkoutSchema } from '../schemas/workoutSchemas';
import { asyncHandler } from '../utils/asyncHandler';
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
workoutRoutes.get('/templates', asyncHandler(listWorkoutTemplates));
workoutRoutes.post('/templates/use', asyncHandler(createWorkoutFromTemplate));
workoutRoutes.get('/current', asyncHandler(getCurrentWorkoutPlan));
workoutRoutes.get('/', asyncHandler(listWorkoutPlans));
workoutRoutes.post('/', validate(createWorkoutSchema), asyncHandler(createWorkoutPlan));
workoutRoutes.get('/:id', asyncHandler(getWorkoutPlan));
workoutRoutes.patch('/:id', validate(updateWorkoutSchema), asyncHandler(updateWorkoutPlan));
workoutRoutes.put('/:id/exercises', asyncHandler(reorderExercises));
workoutRoutes.delete('/:id', asyncHandler(deleteWorkoutPlan));
workoutRoutes.post('/:id/schedule', asyncHandler(scheduleWorkoutPlan));
workoutRoutes.put('/:id/schedule', asyncHandler(updateWeeklySchedule));
workoutRoutes.post('/:id/complete', asyncHandler(markWorkoutCompleted));
workoutRoutes.get('/:id/ai-review', asyncHandler(getWorkoutAiReview));
workoutRoutes.post('/:id/ai-review', asyncHandler(refreshWorkoutAiReview));
