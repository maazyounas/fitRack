/**
 * recommendationService.ts — Personalized workout + diet plans.
 * Based on body type, goals, metrics, and activity level.
 */

import type { BodyType } from '@/types/bodyAnalysis';
import type { ActivityLevel, ExperienceLevel, OnboardingGoal } from '@/store/onboardingStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkoutDay = {
  day: string;
  focus: string;
  exercises: string[];
};

export type CardioRecommendation = {
  type: string;
  duration: string;
  frequency: string;
  intensity: 'low' | 'moderate' | 'high';
};

export type DietPlan = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  hydrationL: number;
  mealFrequency: number;
  notes: string[];
};

export type RecommendationPlan = {
  workoutSplit: WorkoutDay[];
  cardio: CardioRecommendation;
  recoveryGuidance: string[];
  trainingFrequency: number;
  intensityLevel: 'beginner' | 'intermediate' | 'advanced';
  diet: DietPlan;
};

// ─── Calorie Calculator (Mifflin-St Jeor) ────────────────────────────────────

function calculateBMR(gender: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// ─── Workout Splits ───────────────────────────────────────────────────────────

const SPLITS: Record<BodyType, WorkoutDay[]> = {
  ectomorph: [
    { day: 'Monday', focus: 'Push (Chest/Shoulders/Triceps)', exercises: ['Bench Press 4×6', 'Overhead Press 4×6', 'Incline DB Press 3×8', 'Lateral Raises 3×12', 'Tricep Dips 3×10'] },
    { day: 'Wednesday', focus: 'Pull (Back/Biceps)', exercises: ['Deadlift 4×5', 'Barbell Row 4×6', 'Lat Pulldown 3×10', 'Face Pulls 3×15', 'Bicep Curl 3×10'] },
    { day: 'Friday', focus: 'Legs (Quads/Hamstrings/Glutes)', exercises: ['Back Squat 4×6', 'Romanian Deadlift 3×8', 'Leg Press 3×12', 'Walking Lunges 3×10/leg', 'Calf Raises 4×15'] },
    { day: 'Saturday', focus: 'Optional: Weak Points', exercises: ['Weighted Dips 3×8', 'Close-Grip Bench 3×8', 'Shrugs 4×12', 'Ab Work 3 sets'] },
  ],
  mesomorph: [
    { day: 'Monday', focus: 'Upper Body Strength', exercises: ['Bench Press 5×5', 'Barbell Row 5×5', 'Overhead Press 3×6', 'Weighted Pull-ups 3×6'] },
    { day: 'Tuesday', focus: 'Lower Body Power', exercises: ['Squat 5×5', 'Romanian Deadlift 4×6', 'Hack Squat 3×10', 'Nordic Curl 3×8'] },
    { day: 'Thursday', focus: 'Upper Hypertrophy', exercises: ['Incline Press 4×10', 'Cable Row 4×12', 'DB Shoulder Press 3×12', 'Fly 3×15', 'Curls 3×12'] },
    { day: 'Friday', focus: 'Lower Hypertrophy + Core', exercises: ['Front Squat 4×8', 'Leg Curl 4×12', 'Walking Lunges 3×12', 'Plank 3×60s', 'Ab Wheel 3×10'] },
  ],
  endomorph: [
    { day: 'Monday', focus: 'Full Body Circuit A', exercises: ['Goblet Squat 3×15', 'Push-up Variations 3×15', 'DB Row 3×15', 'Jump Rope 3×60s'] },
    { day: 'Wednesday', focus: 'Full Body Circuit B', exercises: ['Deadlift 3×12', 'Incline Push-up 3×15', 'Cable Pull 3×15', 'Mountain Climbers 3×30s'] },
    { day: 'Friday', focus: 'HIIT + Resistance', exercises: ['Barbell Complex 4 rounds', 'Box Jumps 4×8', 'Farmers Walk 4×30m', 'Battle Ropes 4×30s'] },
    { day: 'Sunday', focus: 'Active Recovery Cardio', exercises: ['35 min steady-state walk/jog', 'Mobility flow 20 min', 'Foam rolling'] },
  ],
};

// ─── Main Generator ───────────────────────────────────────────────────────────

export function generateRecommendationPlan(input: {
  bodyType: BodyType;
  goals: OnboardingGoal[];
  activityLevel: ActivityLevel;
  experience: ExperienceLevel;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  age: number;
}): RecommendationPlan {
  const { bodyType, activityLevel, experience, gender, heightCm, weightKg, age, goals } = input;

  // Calorie calculation
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

  // Calorie adjustment by goal + body type
  let calorieAdjust = 0;
  if (goals.includes('lose_weight') || bodyType === 'endomorph') calorieAdjust = -400;
  else if (goals.includes('build_muscle') && bodyType === 'ectomorph') calorieAdjust = +500;
  else if (goals.includes('build_muscle')) calorieAdjust = +250;

  const calories = Math.round(tdee + calorieAdjust);

  // Macro ratios
  let proteinRatio = 0.3;
  let carbRatio = 0.4;
  let fatRatio = 0.3;

  if (bodyType === 'endomorph' || goals.includes('lose_weight')) {
    proteinRatio = 0.35; carbRatio = 0.30; fatRatio = 0.35;
  } else if (bodyType === 'ectomorph' || goals.includes('build_muscle')) {
    proteinRatio = 0.28; carbRatio = 0.48; fatRatio = 0.24;
  }

  const proteinG = Math.round((calories * proteinRatio) / 4);
  const carbsG = Math.round((calories * carbRatio) / 4);
  const fatG = Math.round((calories * fatRatio) / 9);

  // Cardio
  const cardioMap: Record<BodyType, CardioRecommendation> = {
    ectomorph: { type: 'Low-intensity steady state (LISS)', duration: '20–25 min', frequency: '1–2×/week', intensity: 'low' },
    mesomorph: { type: 'Zone 2 cardio + HIIT intervals', duration: '30 min', frequency: '2–3×/week', intensity: 'moderate' },
    endomorph: { type: 'HIIT sprints + LISS sessions', duration: '30–45 min', frequency: '3–4×/week', intensity: 'high' },
  };

  const recoveryMap: Record<BodyType, string[]> = {
    ectomorph: ['Sleep 8–9 hours for maximal growth hormone release.', 'Avoid training to failure every session.', 'Prioritize protein within 30 min post-workout.'],
    mesomorph: ['Sleep 7–8 hours for recovery and performance.', 'Deload every 6–8 weeks to prevent plateau.', 'Stretch 10 min post-session to reduce DOMS.'],
    endomorph: ['Avoid long sedentary periods — move hourly.', 'Cold showers reduce inflammation and DOMS.', 'Track non-exercise activity (NEAT) for better fat loss.'],
  };

  const frequencyMap: Record<ExperienceLevel, number> = {
    beginner: 3,
    intermediate: 4,
    advanced: 5,
  };

  const diet: DietPlan = {
    calories,
    proteinG,
    carbsG,
    fatG,
    hydrationL: Math.round((weightKg * 0.033) * 10) / 10,
    mealFrequency: bodyType === 'ectomorph' ? 5 : bodyType === 'endomorph' ? 4 : 4,
    notes: [
      `Eat ${proteinG}g protein distributed across ${bodyType === 'ectomorph' ? 5 : 4} meals.`,
      `Target ${calories} kcal daily (TDEE ${Math.round(tdee)} + ${calorieAdjust > 0 ? '+' : ''}${calorieAdjust} adjustment).`,
      bodyType === 'endomorph' ? 'Front-load carbs before workouts, minimize in evenings.' : 'Ensure post-workout meal contains carbs + protein.',
    ],
  };

  return {
    workoutSplit: SPLITS[bodyType],
    cardio: cardioMap[bodyType],
    recoveryGuidance: recoveryMap[bodyType],
    trainingFrequency: frequencyMap[experience],
    intensityLevel: experience,
    diet,
  };
}
