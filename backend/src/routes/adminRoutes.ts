import { Router } from 'express';
import {
  createExercise,
  deleteCommunityComment,
  deleteCommunityPost,
  deleteExercise,
  getAdminDashboard,
  getUsers,
  sendManualNotification,
  toggleUserStatus,
  updateExercise,
} from '../controllers/adminController';
import { requireAdmin, requireAuth } from '../middleware/auth';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get('/dashboard', getAdminDashboard);
adminRoutes.get('/users', getUsers);
adminRoutes.patch('/users/:userId/toggle-status', toggleUserStatus);
adminRoutes.post('/exercises', createExercise);
adminRoutes.put('/exercises/:exerciseId', updateExercise);
adminRoutes.delete('/exercises/:exerciseId', deleteExercise);
adminRoutes.post('/notifications/send', sendManualNotification);
adminRoutes.delete('/community/posts/:postId', deleteCommunityPost);
adminRoutes.delete('/community/posts/:postId/comments/:commentId', deleteCommunityComment);
