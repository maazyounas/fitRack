import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import {
  addExerciseComment,
  createExercise,
  deleteExercise,
  getExercise,
  getExerciseFilters,
  listExercises,
  rateExercise,
  saveExerciseNotes,
  toggleFavorite,
  updateExercise,
} from '../controllers/exerciseController';

export const exerciseRoutes = Router();

exerciseRoutes.use(requireAuth);
exerciseRoutes.get('/filters', getExerciseFilters);
exerciseRoutes.get('/', listExercises);
exerciseRoutes.get('/:id', getExercise);
exerciseRoutes.patch('/:id/favorite', toggleFavorite);
exerciseRoutes.post('/:id/rating', rateExercise);
exerciseRoutes.patch('/:id/notes', saveExerciseNotes);
exerciseRoutes.post('/:id/comments', addExerciseComment);
exerciseRoutes.post('/', requireAdmin, createExercise);
exerciseRoutes.patch('/:id', requireAdmin, updateExercise);
exerciseRoutes.delete('/:id', requireAdmin, deleteExercise);
