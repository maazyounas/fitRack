export type NutrientTotals = {
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

export type FoodItem = {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  nutrients: NutrientTotals;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealEntry = {
  id: string;
  name: string;
  mealType: MealType;
  consumedAt: string;
  notes: string;
  foods: FoodItem[];
  totals: NutrientTotals;
};

export type WaterLog = {
  id: string;
  amountMl: number;
  loggedAt: string;
};

export type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  waterMl: number;
};

export type HydrationReminder = {
  enabled: boolean;
  intervalMinutes: number;
  startHour: number;
  endHour: number;
};

export type NutritionRecommendation = {
  category: 'meal' | 'diet' | 'recipe' | 'hydration';
  title: string;
  description: string;
};

export type DailyNutritionReport = {
  date: string;
  totals: NutrientTotals;
  waterConsumedMl: number;
  mealsLogged: number;
};

export type TrendPoint = {
  date: string;
  label: string;
  calories: number;
  protein: number;
  waterMl: number;
};

export type NutritionDashboard = {
  goals: NutritionGoals;
  hydrationReminder: HydrationReminder;
  meals: MealEntry[];
  waterLogs: WaterLog[];
  recommendations: NutritionRecommendation[];
  reports: {
    daily: DailyNutritionReport;
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
};

export type MealPayload = {
  name: string;
  mealType: MealType;
  consumedAt: string;
  notes: string;
  foods: {
    name: string;
    quantity: number;
    unit: string;
    nutrients: NutrientTotals;
  }[];
};
