import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import { getAiCoachSummary, getWeeklyInsightsController, getWorkoutRecommendations, sendAiCoachMessage } from '../controllers/aiCoachController';

export const aiRoutes = Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});

aiRoutes.use(requireAuth);
aiRoutes.use(aiLimiter);

aiRoutes.get('/coach', getAiCoachSummary);
aiRoutes.post('/coach/chat', sendAiCoachMessage);
aiRoutes.get('/recommendations/workout', getWorkoutRecommendations);
aiRoutes.get('/insights/weekly', getWeeklyInsightsController);
