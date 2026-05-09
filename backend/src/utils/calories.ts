type CaloriesInput = {
  age?: number;
  heightCm?: number;
  weightKg?: number;
  gender?: string;
};

export function calculateDailyCalories({ age, heightCm, weightKg, gender = 'male' }: CaloriesInput) {
  if (!age || !heightCm || !weightKg) {
    return null;
  }

  const s = gender === 'female' ? -161 : 5;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;
  return Math.max(Math.round(bmr * 1.2), 1200);
}
