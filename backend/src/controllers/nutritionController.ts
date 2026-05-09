import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { NutritionProfileModel } from '../models/NutritionProfile';
import { HttpError } from '../utils/http';

type AuthedRequest = Request & { userId?: string };

type NutrientTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  vitaminC: number;
  vitaminD: number;
};

const emptyTotals = (): NutrientTotals => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  potassium: 0,
  calcium: 0,
  iron: 0,
  vitaminC: 0,
  vitaminD: 0,
});

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function toDateOnlyKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(left: Date, right: Date) {
  return toDateOnlyKey(left) === toDateOnlyKey(right);
}

function addTotals(current: NutrientTotals, next: Partial<NutrientTotals> | undefined): NutrientTotals {
  const merged = { ...current };
  for (const key of Object.keys(merged) as Array<keyof NutrientTotals>) {
    merged[key] = round((merged[key] ?? 0) + Number(next?.[key] ?? 0));
  }
  return merged;
}

function normalizeTotals(payload?: Partial<NutrientTotals>): NutrientTotals {
  return addTotals(emptyTotals(), payload);
}

function calculateMealTotals(foods: Array<{ nutrients?: Partial<NutrientTotals> }> = []) {
  return foods.reduce((totals, food) => addTotals(totals, food.nutrients), emptyTotals());
}

async function getOrCreateProfile(userId: string) {
  let profile = await NutritionProfileModel.findOne({ ownerId: userId });
  if (!profile) {
    profile = await NutritionProfileModel.create({ ownerId: userId });
  }
  return profile;
}

function normalizeMeal(meal: any) {
  return {
    id: meal.id,
    name: meal.name,
    mealType: meal.mealType,
    consumedAt: meal.consumedAt,
    notes: meal.notes,
    foods: (meal.foods ?? []).map((food: any) => ({
      id: food.id,
      name: food.name,
      quantity: food.quantity,
      unit: food.unit,
      nutrients: normalizeTotals(food.nutrients),
    })),
    totals: normalizeTotals(meal.totals),
  };
}

function normalizeWaterLog(log: any) {
  return {
    id: log.id,
    amountMl: log.amountMl,
    loggedAt: log.loggedAt,
  };
}

function buildRecommendations(profile: any, todayTotals: NutrientTotals, waterConsumedMl: number) {
  const goals = profile.goals;
  const suggestions = [];

  if (todayTotals.protein < goals.protein * 0.7) {
    suggestions.push({
      category: 'meal',
      title: 'Raise protein at your next meal',
      description: 'Add Greek yogurt, eggs, tofu, chicken, or lentils to close the protein gap.',
    });
  }

  if (todayTotals.fiber < goals.fiber * 0.6) {
    suggestions.push({
      category: 'diet',
      title: 'Boost fiber gradually',
      description: 'Pair meals with fruit, oats, beans, or vegetables to improve fullness and digestion.',
    });
  }

  if (waterConsumedMl < goals.waterMl * 0.6) {
    suggestions.push({
      category: 'hydration',
      title: 'Hydration is trending low',
      description: 'Aim for one glass of water between meals for the rest of the day.',
    });
  }

  const carbBias = todayTotals.carbs > goals.carbs * 1.1 && todayTotals.protein < goals.protein;
  suggestions.push({
    category: 'diet',
    title: carbBias ? 'Balance carbs with lean protein' : 'Keep meals balanced',
    description: carbBias
      ? 'Try pairing carb-heavy meals with lean protein and vegetables for steadier energy.'
      : 'Use the plate method: half vegetables, a quarter protein, and a quarter smart carbs.',
  });

  suggestions.push({
    category: 'recipe',
    title: 'Recipe idea: salmon quinoa bowl',
    description: 'Salmon, quinoa, spinach, tomatoes, and lemon dressing give protein, fiber, and micronutrients.',
  });

  return suggestions.slice(0, 4);
}

function buildTrendData(profile: any, days: number) {
  const now = new Date();
  const points = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(now);
    current.setUTCDate(now.getUTCDate() - offset);
    const dayMeals = (profile.meals ?? []).filter((meal: any) => isSameDay(new Date(meal.consumedAt), current));
    const dayWater = (profile.waterLogs ?? []).filter((log: any) => isSameDay(new Date(log.loggedAt), current));
    const totals = dayMeals.reduce((acc: NutrientTotals, meal: any) => addTotals(acc, meal.totals), emptyTotals());
    const waterMl = dayWater.reduce((sum: number, log: any) => sum + Number(log.amountMl ?? 0), 0);

    points.push({
      date: toDateOnlyKey(current),
      label:
        days > 14
          ? current.toLocaleDateString('en-US', { month: 'short' })
          : current.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: totals.calories,
      protein: totals.protein,
      waterMl,
    });
  }

  return points;
}

function buildDashboard(profile: any) {
  const now = new Date();
  const mealsToday = (profile.meals ?? [])
    .filter((meal: any) => isSameDay(new Date(meal.consumedAt), now))
    .sort((a: any, b: any) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime());
  const waterToday = (profile.waterLogs ?? [])
    .filter((log: any) => isSameDay(new Date(log.loggedAt), now))
    .sort((a: any, b: any) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  const todayTotals = mealsToday.reduce(
    (totals: NutrientTotals, meal: any) => addTotals(totals, meal.totals),
    emptyTotals()
  );
  const waterConsumedMl = waterToday.reduce((sum: number, log: any) => sum + Number(log.amountMl ?? 0), 0);
  const recommendations = buildRecommendations(profile, todayTotals, waterConsumedMl);

  profile.aiSuggestions = recommendations;

  return {
    goals: profile.goals,
    hydrationReminder: profile.hydrationReminder,
    meals: mealsToday.map(normalizeMeal),
    waterLogs: waterToday.map(normalizeWaterLog),
    recommendations,
    reports: {
      daily: {
        date: toDateOnlyKey(now),
        totals: todayTotals,
        waterConsumedMl,
        mealsLogged: mealsToday.length,
      },
      weekly: buildTrendData(profile, 7),
      monthly: buildTrendData(profile, 30),
    },
  };
}

export async function getNutritionDashboard(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);
  const dashboard = buildDashboard(profile);
  await profile.save();
  res.json(dashboard);
}

export async function updateNutritionGoals(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);

  profile.goals = {
    ...profile.goals,
    ...req.body.goals,
  };

  if (req.body.hydrationReminder) {
    profile.hydrationReminder = {
      ...profile.hydrationReminder,
      ...req.body.hydrationReminder,
    };
  }

  await profile.save();
  res.json({
    goals: profile.goals,
    hydrationReminder: profile.hydrationReminder,
  });
}

export async function createMealEntry(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);
  const payload = req.body as {
    name?: string;
    mealType?: string;
    consumedAt?: string;
    notes?: string;
    foods?: Array<{
      name: string;
      quantity: number;
      unit?: string;
      nutrients?: Partial<NutrientTotals>;
    }>;
  };

  if (!payload.name || !Array.isArray(payload.foods) || payload.foods.length === 0) {
    throw new HttpError(400, 'Meal name and at least one food item are required.');
  }

  const foods = payload.foods.map((food) => ({
    name: food.name,
    quantity: Number(food.quantity ?? 0),
    unit: food.unit ?? 'serving',
    nutrients: normalizeTotals(food.nutrients),
  }));

  const meal = {
    name: payload.name,
    mealType: payload.mealType ?? 'snack',
    consumedAt: payload.consumedAt ? new Date(payload.consumedAt) : new Date(),
    notes: payload.notes ?? '',
    foods,
    totals: calculateMealTotals(foods),
  };

  profile.meals.unshift(meal as any);
  await profile.save();

  res.status(201).json({ meal: normalizeMeal(profile.meals[0]) });
}

export async function updateMealEntry(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);
  const meal = profile.meals.id(String(req.params.id));

  if (!meal) {
    throw new HttpError(404, 'Meal entry not found.');
  }

  if (req.body.name !== undefined) {
    meal.name = req.body.name;
  }

  if (req.body.mealType !== undefined) {
    meal.mealType = req.body.mealType;
  }

  if (req.body.consumedAt !== undefined) {
    meal.consumedAt = new Date(req.body.consumedAt);
  }

  if (req.body.notes !== undefined) {
    meal.notes = req.body.notes;
  }

  if (Array.isArray(req.body.foods)) {
    meal.foods = req.body.foods.map((food: any) => ({
      name: food.name,
      quantity: Number(food.quantity ?? 0),
      unit: food.unit ?? 'serving',
      nutrients: normalizeTotals(food.nutrients),
    })) as any;
    meal.totals = calculateMealTotals(meal.foods as any) as any;
  }

  await profile.save();
  res.json({ meal: normalizeMeal(meal) });
}

export async function logWaterIntake(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);
  const amountMl = Number(req.body.amountMl ?? 0);

  if (!amountMl || amountMl <= 0) {
    throw new HttpError(400, 'Water intake amount must be greater than zero.');
  }

  profile.waterLogs.unshift({
    amountMl,
    loggedAt: req.body.loggedAt ? new Date(req.body.loggedAt) : new Date(),
  } as any);

  await profile.save();
  res.status(201).json({ waterLog: normalizeWaterLog(profile.waterLogs[0]) });
}

export async function getNutritionRecommendations(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);
  const dashboard = buildDashboard(profile);
  await profile.save();
  res.json({ recommendations: dashboard.recommendations });
}

export async function generateNutritionReportPdf(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);
  const dashboard = buildDashboard(profile);

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=nutrition_report.pdf');

  doc.pipe(res);

  // Title
  doc.fontSize(24).text('FitRack Nutrition Report', { align: 'center' });
  doc.moveDown(2);

  // Daily Snapshot
  doc.fontSize(18).text('Daily Snapshot', { underline: true });
  doc.fontSize(12).moveDown(0.5);
  doc.text(`Date: ${dashboard.reports.daily.date}`);
  doc.text(`Calories: ${dashboard.reports.daily.totals.calories} / ${dashboard.goals.calories} kcal`);
  doc.text(`Protein: ${dashboard.reports.daily.totals.protein}g`);
  doc.text(`Carbs: ${dashboard.reports.daily.totals.carbs}g`);
  doc.text(`Fats: ${dashboard.reports.daily.totals.fats}g`);
  doc.text(`Water Intake: ${dashboard.reports.daily.waterConsumedMl}mL`);
  doc.moveDown(2);

  // Weekly Trends
  doc.fontSize(18).text('Last 7 Days Summary', { underline: true });
  doc.fontSize(12).moveDown(0.5);
  dashboard.reports.weekly.forEach((day: any) => {
    doc.text(`${day.date} (${day.label}): ${day.calories} kcal | ${day.protein}g protein | ${day.waterMl}mL water`);
  });

  doc.end();
}
