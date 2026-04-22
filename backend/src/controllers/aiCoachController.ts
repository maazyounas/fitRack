import { Request, Response } from 'express';
import { NutritionProfileModel } from '../models/NutritionProfile';
import { ProgressProfileModel } from '../models/ProgressProfile';
import { UserModel } from '../models/User';
import { WorkoutPlanModel } from '../models/WorkoutPlan';
import { analyzeRecovery, answerCoachQuestion, buildCoachSummary, detectStress } from '../services/aiCoachService';
import { HttpError } from '../utils/http';

type AuthedRequest = Request & { userId?: string };

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(left: Date, right: Date) {
  return toDayKey(left) === toDayKey(right);
}

async function buildSnapshot(userId: string) {
  const [user, nutrition, progress, workouts] = await Promise.all([
    UserModel.findById(userId),
    NutritionProfileModel.findOne({ ownerId: userId }),
    ProgressProfileModel.findOne({ ownerId: userId }),
    WorkoutPlanModel.find({ ownerId: userId }).sort({ updatedAt: -1 }).limit(4),
  ]);

  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const now = new Date();
  const nutritionMeals = (nutrition?.meals ?? []).filter((meal: any) => isSameDay(new Date(meal.consumedAt), now));
  const nutritionWater = (nutrition?.waterLogs ?? []).filter((log: any) => isSameDay(new Date(log.loggedAt), now));
  const totals = nutritionMeals.reduce(
    (acc: any, meal: any) => ({
      calories: acc.calories + Number(meal.totals?.calories ?? 0),
      protein: acc.protein + Number(meal.totals?.protein ?? 0),
    }),
    { calories: 0, protein: 0 }
  );

  const progressEntries = [...(progress?.entries ?? [])].sort(
    (left: any, right: any) => new Date(left.loggedAt).getTime() - new Date(right.loggedAt).getTime()
  );
  const latestProgress = progressEntries.at(-1);

  return {
    userName: user.profile.name,
    dailyCalories: user.profile.dailyCalories,
    notificationsEnabled: user.preferences.notificationsEnabled,
    recentWorkouts: workouts.map((plan: any) => {
      const completed = (plan.schedule ?? []).filter((entry: any) => entry.completed).length;
      const total = (plan.schedule ?? []).length || 1;
      const missedCount = (plan.schedule ?? []).filter(
        (entry: any) => !entry.completed && new Date(entry.scheduledDate).getTime() < Date.now()
      ).length;
      return {
        name: plan.name,
        completionRate: completed / total,
        missedCount,
        updatedAt: plan.updatedAt,
      };
    }),
    nutrition: {
      calories: totals.calories,
      protein: totals.protein,
      waterMl: nutritionWater.reduce((sum: number, log: any) => sum + Number(log.amountMl ?? 0), 0),
      calorieGoal: nutrition?.goals?.calories ?? user.profile.dailyCalories ?? 2200,
      proteinGoal: nutrition?.goals?.protein ?? 140,
      waterGoal: nutrition?.goals?.waterMl ?? 2500,
    },
    progress: {
      currentWeightKg: Number(latestProgress?.weightKg ?? user.profile.weightKg ?? 0),
      bodyFatPercent: Number(latestProgress?.measurements?.bodyFatPercent ?? 0),
      muscleMassKg: Number(latestProgress?.measurements?.muscleMassKg ?? 0),
      performanceScore:
        latestProgress?.gymPerformance?.length
          ? latestProgress.gymPerformance.reduce(
              (sum: number, item: any) => sum + Number(item.oneRepMaxEstimate ?? 0),
              0
            ) / latestProgress.gymPerformance.length
          : 0,
      streakDays: Number(progress?.streakDays ?? 0),
    },
  };
}

export async function getAiCoachSummary(req: AuthedRequest, res: Response) {
  const snapshot = await buildSnapshot(req.userId as string);
  res.json({
    summary: buildCoachSummary(snapshot),
    recovery: analyzeRecovery(snapshot),
    stress: detectStress(snapshot),
    dataPoints: snapshot,
  });
}

export async function sendAiCoachMessage(req: AuthedRequest, res: Response) {
  const snapshot = await buildSnapshot(req.userId as string);
  const message = String(req.body.message ?? '').trim();
  if (!message) {
    throw new HttpError(400, 'Message is required.');
  }

  res.json({
    response: answerCoachQuestion(snapshot, message),
  });
}
