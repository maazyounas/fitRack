import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  addChallengeProgress,
  addPostComment,
  createPost,
  getCommunityDashboard,
  joinChallenge,
  toggleFollowUser,
  togglePostLike,
} from '../controllers/communityController';

export const communityRoutes = Router();

communityRoutes.use(requireAuth);
communityRoutes.get('/', getCommunityDashboard);
communityRoutes.post('/follow/:userId', toggleFollowUser);
communityRoutes.post('/posts', createPost);
communityRoutes.post('/posts/:postId/like', togglePostLike);
communityRoutes.post('/posts/:postId/comments', addPostComment);
communityRoutes.post('/challenges/:challengeId/join', joinChallenge);
communityRoutes.post('/challenges/:challengeId/progress', addChallengeProgress);
