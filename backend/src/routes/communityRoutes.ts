import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPostSchema, addCommentSchema, challengeProgressSchema } from '../schemas/communitySchemas';
import {
  addChallengeProgress,
  addPostComment,
  createPost,
  deletePost,
  getCommunityDashboard,
  getLeaderboard,
  getPublicProfile,
  joinChallenge,
  reportPost,
  searchUsers,
  toggleFollowUser,
  togglePostLike,
} from '../controllers/communityController';

export const communityRoutes = Router();

communityRoutes.use(requireAuth);
communityRoutes.get('/', getCommunityDashboard);
communityRoutes.get('/search', searchUsers);
communityRoutes.get('/profile/:userId', getPublicProfile);
communityRoutes.post('/follow/:userId', toggleFollowUser);
communityRoutes.post('/posts', validate(createPostSchema), createPost);
communityRoutes.post('/posts/:postId/like', togglePostLike);
communityRoutes.post('/posts/:postId/comments', validate(addCommentSchema), addPostComment);
communityRoutes.post('/posts/:postId/report', reportPost);
communityRoutes.delete('/posts/:postId', deletePost);
communityRoutes.post('/challenges/:challengeId/join', joinChallenge);
communityRoutes.post('/challenges/:challengeId/progress', validate(challengeProgressSchema), addChallengeProgress);
communityRoutes.get('/challenges/:challengeId/leaderboard', getLeaderboard);

