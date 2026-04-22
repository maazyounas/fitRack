import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getAiCoachSummary, sendAiCoachMessage } from '../controllers/aiCoachController';

export const aiRoutes = Router();

aiRoutes.use(requireAuth);
aiRoutes.get('/coach', getAiCoachSummary);
aiRoutes.post('/coach/chat', sendAiCoachMessage);
