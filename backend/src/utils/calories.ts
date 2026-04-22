type CaloriesInput = {
  age?: number;
  heightCm?: number;
  weightKg?: number;
};

export function calculateDailyCalories({ age, heightCm, weightKg }: CaloriesInput) {
  if (!age || !heightCm || !weightKg) {
    return null;
  }

  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.max(Math.round(bmr * 1.2), 1200);
}
