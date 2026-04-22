import { Router } from 'express';
import {
  deleteCommunityComment,
  deleteCommunityPost,
  disableUserAccount,
  getAdminDashboard,
} from '../controllers/adminController';
import { requireAdmin, requireAuth } from '../middleware/auth';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get('/dashboard', getAdminDashboard);
adminRoutes.patch('/users/:userId/disable', disableUserAccount);
adminRoutes.delete('/community/posts/:postId', deleteCommunityPost);
adminRoutes.delete('/community/posts/:postId/comments/:commentId', deleteCommunityComment);
