import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createMealEntry,
  getNutritionDashboard,
  getNutritionRecommendations,
  logWaterIntake,
  updateMealEntry,
  updateNutritionGoals,
  generateNutritionReportPdf,
} from '../controllers/nutritionController';

export const nutritionRoutes = Router();

nutritionRoutes.use(requireAuth);
nutritionRoutes.get('/', getNutritionDashboard);
nutritionRoutes.get('/report/pdf', generateNutritionReportPdf);
nutritionRoutes.get('/recommendations', getNutritionRecommendations);
nutritionRoutes.patch('/goals', updateNutritionGoals);
nutritionRoutes.post('/meals', createMealEntry);
nutritionRoutes.patch('/meals/:id', updateMealEntry);
nutritionRoutes.post('/water', logWaterIntake);
