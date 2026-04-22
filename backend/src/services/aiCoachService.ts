type CoachingSnapshot = {
  userName: string;
  dailyCalories?: number | null;
  notificationsEnabled: boolean;
  recentWorkouts: Array<{
    name: string;
    completionRate: number;
    missedCount: number;
    updatedAt: Date;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    waterMl: number;
    calorieGoal: number;
    proteinGoal: number;
    waterGoal: number;
  };
  progress: {
    currentWeightKg: number;
    bodyFatPercent: number;
    muscleMassKg: number;
    performanceScore: number;
    streakDays: number;
  };
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function analyzeRecovery(snapshot: CoachingSnapshot) {
  const missedWorkouts = snapshot.recentWorkouts.reduce((sum, workout) => sum + workout.missedCount, 0);
  const hardTrainingLoad = snapshot.recentWorkouts.filter((workout) => workout.completionRate > 0.7).length;
  const lowHydration = snapshot.nutrition.waterMl < snapshot.nutrition.waterGoal * 0.65;
  const lowProtein = snapshot.nutrition.protein < snapshot.nutrition.proteinGoal * 0.7;

  const score = Math.max(
    5,
    90 -
      missedWorkouts * 8 -
      hardTrainingLoad * 4 -
      (lowHydration ? 12 : 0) -
      (lowProtein ? 8 : 0) +
      Math.min(snapshot.progress.streakDays, 7) * 2
  );

  const recommendRecoveryDay =
    missedWorkouts >= 2 || (hardTrainingLoad >= 3 && (lowHydration || lowProtein)) || score < 55;

  return {
    recoveryScore: round(score),
    recommendRecoveryDay,
    suggestions: [
      recommendRecoveryDay
        ? 'Schedule an active recovery or full rest day within the next 24 hours.'
        : 'You can train as planned, but keep one lighter session this week.',
      lowHydration
        ? 'Hydration is trending low. Add 500 to 750 mL before your next workout.'
        : 'Hydration is on track. Maintain water intake around training.',
      lowProtein
        ? 'Protein intake is below target. Add a recovery meal with lean protein today.'
        : 'Protein intake supports recovery well today.',
    ],
  };
}

export function detectStress(snapshot: CoachingSnapshot) {
  const missedWorkouts = snapshot.recentWorkouts.reduce((sum, workout) => sum + workout.missedCount, 0);
  const nutritionGap = snapshot.nutrition.calorieGoal
    ? snapshot.nutrition.calories / snapshot.nutrition.calorieGoal
    : 1;
  const hydrationGap = snapshot.nutrition.waterGoal ? snapshot.nutrition.waterMl / snapshot.nutrition.waterGoal : 1;

  const stressScore = Math.max(
    10,
    35 +
      missedWorkouts * 10 +
      (nutritionGap < 0.7 ? 15 : 0) +
      (hydrationGap < 0.6 ? 12 : 0) -
      Math.min(snapshot.progress.streakDays, 5) * 3
  );

  return {
    stressScore: round(stressScore),
    level: stressScore >= 70 ? 'high' : stressScore >= 45 ? 'moderate' : 'low',
    markers: [
      nutritionGap < 0.7 ? 'Fuel intake is lower than target.' : 'Energy intake is relatively stable.',
      hydrationGap < 0.6 ? 'Hydration may be affecting recovery.' : 'Hydration is not a major stress flag.',
      missedWorkouts >= 2 ? 'Missed sessions suggest recovery or schedule strain.' : 'Workout adherence looks steady.',
    ],
  };
}

export function buildCoachSummary(snapshot: CoachingSnapshot) {
  const recovery = analyzeRecovery(snapshot);
  const stress = detectStress(snapshot);

  return {
    recovery,
    stress,
    insights: [
      `Recovery score is ${recovery.recoveryScore}/100.`,
      `Stress level is ${stress.level} with a score of ${stress.stressScore}/100.`,
      snapshot.progress.performanceScore > 0
        ? `Recent performance score is ${snapshot.progress.performanceScore}, which helps guide intensity.`
        : 'Not enough gym performance data yet, so coaching is leaning more on nutrition and adherence.',
    ],
    suggestedRecoveryDays: recovery.recommendRecoveryDay
      ? ['Take tomorrow as recovery-focused.', 'Shift high-intensity work by one day and prioritize sleep and hydration.']
      : ['No immediate recovery day flag.', 'Keep one lighter session in your next 3 to 4 days.'],
  };
}

export function answerCoachQuestion(snapshot: CoachingSnapshot, message: string) {
  const normalized = message.toLowerCase();
  const summary = buildCoachSummary(snapshot);

  if (normalized.includes('recovery') || normalized.includes('rest day')) {
    return {
      reply: `Based on your latest data, ${summary.suggestedRecoveryDays[0].toLowerCase()} ${summary.recovery.suggestions[1]}`,
      followUps: ['Would you like a lighter training-day alternative?', 'Want a simple recovery checklist for today?'],
    };
  }

  if (normalized.includes('stress') || normalized.includes('tired') || normalized.includes('fatigue')) {
    return {
      reply: `Your current stress trend looks ${summary.stress.level}. ${summary.stress.markers.join(' ')}`,
      followUps: ['Do you want stress-reduction nutrition tips?', 'Should I suggest a low-fatigue workout option?'],
    };
  }

  if (normalized.includes('diet') || normalized.includes('eat') || normalized.includes('nutrition')) {
    return {
      reply: `Today you are at ${snapshot.nutrition.calories}/${snapshot.nutrition.calorieGoal} kcal and ${snapshot.nutrition.protein}/${snapshot.nutrition.proteinGoal}g protein. ${summary.recovery.suggestions[2]}`,
      followUps: ['Want a post-workout meal idea?', 'Should I suggest a higher-protein day plan?'],
    };
  }

  if (normalized.includes('workout') || normalized.includes('train') || normalized.includes('gym')) {
    return {
      reply: summary.recovery.recommendRecoveryDay
        ? 'I would keep today lighter: mobility, walking, core, or technique work instead of a hard session.'
        : 'Training looks reasonable today. Keep intensity controlled and stop one or two reps before failure on most sets.',
      followUps: ['Need a 30-minute workout suggestion?', 'Want me to tailor advice around recovery instead of performance?'],
    };
  }

  return {
    reply: `Here’s the coaching read for ${snapshot.userName}: ${summary.insights.join(' ')} ${summary.recovery.suggestions[0]}`,
    followUps: ['Ask about recovery days.', 'Ask about stress or nutrition.'],
  };
}
