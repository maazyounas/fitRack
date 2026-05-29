import { AiCoachChatResponse, AiCoachDataPoints, AiCoachSummary } from '@/types/ai';
import { DailyNutritionReport, NutritionGoals } from '@/types/nutrition';
import { ProgressDashboard, ProgressEntry, ProgressTrendPoint } from '@/types/progress';
import { User } from '@/types/user';
import { WorkoutPlan } from '@/types/workout';

type CoachSnapshot = {
  user: User | null;
  workouts: WorkoutPlan[];
  nutritionReport: DailyNutritionReport;
  nutritionGoals: NutritionGoals;
  progressSummary: ProgressDashboard['summary'];
  streakDays: number;
  progressEntries: ProgressEntry[];
  monthlyTrend: ProgressTrendPoint[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
}

function buildWorkoutCoachReply(message: string, data: AiCoachDataPoints, summary: AiCoachSummary) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('gain muscle') ||
    normalized.includes('build muscle') ||
    normalized.includes('muscle gain') ||
    normalized.includes('bulk') ||
    normalized.includes('hypertrophy') ||
    normalized.includes('get bigger') ||
    normalized.includes('size up')
  ) {
    const proteinGap = Math.max(0, Math.round(data.nutrition.proteinGoal - data.nutrition.protein));
    const calorieGap = Math.max(0, Math.round(data.nutrition.calorieGoal - data.nutrition.calories));

    return {
      reply: `For muscle gain, use progressive overload, train each muscle 2 times per week, and keep most sets in the 6 to 12 rep range. You are about ${proteinGap} g protein and ${calorieGap} kcal short of today's targets, so add a protein-heavy meal and keep lifting consistently.`,
      followUps: ['Build me a muscle gain workout', 'What should I eat to bulk cleanly?'],
    };
  }

  if (
    normalized.includes('cut') ||
    normalized.includes('fat loss') ||
    normalized.includes('lose fat') ||
    normalized.includes('lose weight') ||
    normalized.includes('lean down') ||
    normalized.includes('shred') ||
    normalized.includes('define')
  ) {
    return {
      reply: 'For fat loss, keep protein high, keep lifting to preserve muscle, and use a small calorie deficit. Add steps or short cardio, but do not stop strength training.',
      followUps: ['Make me a fat loss workout', 'How much should I eat on a cut?'],
    };
  }

  if (
    normalized.includes('split') ||
    normalized.includes('push pull legs') ||
    normalized.includes('ppl') ||
    normalized.includes('bro split') ||
    normalized.includes('upper lower') ||
    normalized.includes('routine') ||
    normalized.includes('program') ||
    normalized.includes('schedule')
  ) {
    return {
      reply: 'For most lifters, push/pull/legs or upper/lower gives better recovery and progression than random workouts. The best split depends on how many days you can train and how hard you recover.',
      followUps: ['Build me a 4-day split', 'Give me a push/pull/legs plan'],
    };
  }

  if (
    normalized.includes('sets') ||
    normalized.includes('reps') ||
    normalized.includes('volume') ||
    normalized.includes('failure') ||
    normalized.includes('progressive overload') ||
    normalized.includes('1rm')
  ) {
    return {
      reply: 'For muscle growth, keep weekly volume high enough, train close to failure on accessory work, and progress by reps first, then weight. Most big lifts should stay around 1 to 3 reps in reserve.',
      followUps: ['How many sets per muscle?', 'What reps are best for hypertrophy?'],
    };
  }

  if (
    normalized.includes('chest') ||
    normalized.includes('back') ||
    normalized.includes('legs') ||
    normalized.includes('shoulders') ||
    normalized.includes('arms') ||
    normalized.includes('biceps') ||
    normalized.includes('triceps') ||
    normalized.includes('core') ||
    normalized.includes('abs') ||
    normalized.includes('glutes') ||
    normalized.includes('hamstrings') ||
    normalized.includes('quads')
  ) {
    return {
      reply: 'Train that muscle with 2 to 4 exercises, start with a compound movement, then finish with 1 to 2 isolation moves. Keep total weekly volume consistent and recover with sleep, protein, and enough calories.',
      followUps: ['Give me exercises for that muscle', 'How many times per week should I train it?'],
    };
  }

  if (/(workout|train|exercise|lift|cardio|session)/.test(normalized)) {
    return {
      reply:
        summary.recovery.recommendRecoveryDay || summary.stress.level === 'high'
          ? 'Use a structured session with one compound lift, one secondary movement, and one or two isolation finishers. Keep it lighter if recovery is poor.'
          : 'Use a structured session with one compound lift, one secondary movement, and one or two isolation finishers. Push progressive overload with good form.',
      followUps: ['Should I push intensity today?', 'Give me a recovery-focused session'],
    };
  }

  return null;
}

function getCompletionRate(plan: WorkoutPlan) {
  if (plan.aiReview?.completionRate !== undefined) {
    return plan.aiReview.completionRate;
  }

  if (!plan.schedule.length) {
    return 100;
  }

  const completed = plan.schedule.filter((entry) => entry.status === 'completed' || entry.completed).length;
  return Math.round((completed / plan.schedule.length) * 100);
}

function getMissedCount(plan: WorkoutPlan) {
  if (typeof plan.missedCount === 'number') {
    return plan.missedCount;
  }

  if (/(gain muscle|build muscle|muscle gain|bulk|hypertrophy|get bigger|size up)/.test(normalized)) {
    const proteinGap = Math.max(0, Math.round(data.nutrition.proteinGoal - data.nutrition.protein));
    const calorieGap = Math.max(0, Math.round(data.nutrition.calorieGoal - data.nutrition.calories));

    return {
      reply: `For muscle gain, use progressive overload, keep your reps mostly in the 6 to 12 range, and eat in a small calorie surplus. You are about ${proteinGap} g protein and ${calorieGap} kcal short of today's targets, so push a protein-heavy meal plus a quality lifting session.`,
      followUps: ['Give me a muscle gain workout', 'What should I eat to bulk cleanly?'],
    };
  }

  if (/(cut|fat loss|lose fat|lose weight|lean down|shred|define|definition)/.test(normalized)) {
    return {
      reply: 'For fat loss, keep protein high, keep lifting heavy enough to hold muscle, and use a small calorie deficit instead of starving yourself. Add steps or short cardio sessions, but do not drop strength training.',
      followUps: ['Make me a fat loss workout', 'How much should I eat on a cut?'],
    };
  }

  if (/(split|push pull legs|ppl|bro split|upper lower|program|routine|schedule)/.test(normalized)) {
    return {
      reply: 'A good split depends on your recovery and how many days you can train. For most people, push/pull/legs or upper/lower works better than random workouts because volume and recovery are easier to control.',
      followUps: ['Build me a 4-day split', 'Give me a push/pull/legs plan'],
    };
  }

  if (/(sets|reps|volume|failure|progressive overload|strength|1rm|one rep|max)/.test(normalized)) {
    return {
      reply: 'For muscle growth, use enough weekly volume, train close to failure on accessories, and keep 1 to 3 reps in reserve on most big lifts. Progress by adding reps first, then load, while keeping form strict.',
      followUps: ['How many sets per muscle?', 'What reps are best for hypertrophy?'],
    };
  }

  if (/(chest|back|legs|shoulders|arms|biceps|triceps|core|abs|glutes|hamstrings|quads)/.test(normalized)) {
    return {
      reply: 'Train the muscle with 2 to 4 exercises, start with a compound movement, then finish with 1 to 2 isolation moves. Keep total weekly volume consistent and recover with sleep, protein, and enough calories.',
      followUps: ['Give me exercises for that muscle', 'How many times per week should I train it?'],
    };
  }

  return plan.schedule.filter((entry) => entry.status === 'missed').length;
}

function getLatestTrendPoint(monthlyTrend: ProgressTrendPoint[]) {
  return monthlyTrend
    .slice()
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0];
}

function getLatestProgressEntry(progressEntries: ProgressEntry[]) {
  return progressEntries
    .slice()
    .sort((left, right) => new Date(right.loggedAt).getTime() - new Date(left.loggedAt).getTime())[0];
}

export function buildAiCoachDataPoints(snapshot: CoachSnapshot): AiCoachDataPoints {
  const recentPlans = snapshot.workouts
    .slice()
    .sort(
      (left, right) =>
        new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
        new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
    )
    .slice(0, 4);
  const latestTrend = getLatestTrendPoint(snapshot.monthlyTrend);
  const latestEntry = getLatestProgressEntry(snapshot.progressEntries);

  return {
    userName: snapshot.user?.profile.name || 'Athlete',
    dailyCalories: snapshot.user?.profile.dailyCalories ?? null,
    notificationsEnabled: snapshot.user?.preferences.notificationsEnabled ?? false,
    recentWorkouts: recentPlans.map((plan) => ({
      name: plan.name,
      completionRate: getCompletionRate(plan),
      missedCount: getMissedCount(plan),
      updatedAt: plan.updatedAt ?? plan.createdAt ?? new Date().toISOString(),
    })),
    nutrition: {
      calories: snapshot.nutritionReport.totals.calories,
      protein: snapshot.nutritionReport.totals.protein,
      waterMl: snapshot.nutritionReport.waterConsumedMl,
      calorieGoal: snapshot.nutritionGoals.calories,
      proteinGoal: snapshot.nutritionGoals.protein,
      waterGoal: snapshot.nutritionGoals.waterMl,
    },
    progress: {
      currentWeightKg:
        snapshot.progressSummary.currentWeightKg || latestEntry?.weightKg || snapshot.user?.profile.weightKg || 0,
      bodyFatPercent: latestTrend?.bodyFatPercent || latestEntry?.measurements.bodyFatPercent || 0,
      muscleMassKg: latestTrend?.muscleMassKg || latestEntry?.measurements.muscleMassKg || 0,
      performanceScore: latestTrend?.performanceScore || 0,
      streakDays: snapshot.streakDays,
    },
  };
}

export function generateAiCoachSummary(data: AiCoachDataPoints): AiCoachSummary {
  const averageCompletion =
    data.recentWorkouts.length > 0
      ? Math.round(
          data.recentWorkouts.reduce((sum, workout) => sum + workout.completionRate, 0) / data.recentWorkouts.length
        )
      : 82;
  const totalMissed = data.recentWorkouts.reduce((sum, workout) => sum + workout.missedCount, 0);
  const hydrationRatio = data.nutrition.waterGoal > 0 ? data.nutrition.waterMl / data.nutrition.waterGoal : 1;
  const proteinRatio = data.nutrition.proteinGoal > 0 ? data.nutrition.protein / data.nutrition.proteinGoal : 1;
  const calorieRatio = data.nutrition.calorieGoal > 0 ? data.nutrition.calories / data.nutrition.calorieGoal : 1;

  let recoveryScore = 78;
  recoveryScore -= Math.max(0, totalMissed - 1) * 6;
  recoveryScore -= averageCompletion < 70 ? 12 : averageCompletion < 82 ? 6 : 0;
  recoveryScore -= hydrationRatio < 0.7 ? 10 : hydrationRatio < 0.9 ? 4 : 0;
  recoveryScore -= proteinRatio < 0.75 ? 8 : proteinRatio < 0.95 ? 3 : 0;
  recoveryScore -= calorieRatio < 0.7 ? 6 : 0;
  recoveryScore -= data.progress.streakDays >= 10 ? 10 : data.progress.streakDays >= 7 ? 5 : 0;
  recoveryScore += data.progress.performanceScore >= 75 ? 4 : 0;
  recoveryScore = clamp(Math.round(recoveryScore), 20, 96);

  let stressScore = 24;
  stressScore += totalMissed * 7;
  stressScore += hydrationRatio < 0.7 ? 18 : hydrationRatio < 0.9 ? 8 : 0;
  stressScore += proteinRatio < 0.75 ? 10 : 0;
  stressScore += averageCompletion < 70 ? 15 : averageCompletion < 82 ? 7 : 0;
  stressScore += data.progress.streakDays >= 10 ? 12 : data.progress.streakDays >= 7 ? 6 : 0;
  stressScore += data.progress.performanceScore < 50 ? 10 : 0;
  stressScore = clamp(Math.round(stressScore), 8, 95);

  const level: AiCoachSummary['stress']['level'] =
    stressScore >= 70 ? 'high' : stressScore >= 40 ? 'moderate' : 'low';
  const recommendRecoveryDay = recoveryScore < 58 || level === 'high';

  const insights = [
    averageCompletion >= 85
      ? 'Workout consistency is strong, which supports steady training progression.'
      : `Workout adherence is around ${averageCompletion}%, so your plan may need a lighter or more flexible structure.`,
    hydrationRatio >= 1
      ? 'Hydration is on target today, which supports performance and recovery.'
      : `Hydration is below target by ${Math.max(0, data.nutrition.waterGoal - data.nutrition.waterMl)} mL.`,
    proteinRatio >= 1
      ? 'Protein intake is covering recovery needs well.'
      : `Protein is behind goal by ${Math.max(0, Math.round(data.nutrition.proteinGoal - data.nutrition.protein))} g, which can slow recovery.`,
  ];

  if (data.progress.streakDays >= 7) {
    insights.push(
      `You are on a ${data.progress.streakDays}-day streak, so recovery quality matters more than adding extra intensity.`
    );
  }

  const markers = [
    ...(totalMissed > 1 ? ['Multiple missed or incomplete workouts recently.'] : []),
    ...(hydrationRatio < 0.9 ? ['Hydration is trending below your daily target.'] : []),
    ...(proteinRatio < 0.8 ? ['Protein intake is lower than your recovery target.'] : []),
    ...(data.progress.streakDays >= 7 ? ['Training streak is long enough to accumulate fatigue.'] : []),
    ...(data.progress.performanceScore < 50 ? ['Performance score is soft, suggesting reduced readiness.'] : []),
  ];

  if (!markers.length) {
    markers.push('Current training and nutrition signals look balanced.');
  }

  const suggestions = [
    ...(recommendRecoveryDay ? ['Use a low-intensity recovery day with walking, mobility, and extra sleep.'] : []),
    ...(hydrationRatio < 1 ? ['Front-load water intake earlier in the day to close the hydration gap.'] : []),
    ...(proteinRatio < 1 ? ['Add a protein-rich meal or shake after training to support muscle repair.'] : []),
    ...(averageCompletion < 80 ? ['Trim training volume slightly if sessions are becoming hard to finish.'] : []),
  ];

  if (!suggestions.length) {
    suggestions.push('Keep the current training load and protect sleep quality to maintain momentum.');
  }

  const offsets = recommendRecoveryDay ? [1, 4] : [3];

  return {
    recovery: {
      recoveryScore,
      recommendRecoveryDay,
      suggestions,
    },
    stress: {
      stressScore,
      level,
      markers,
    },
    insights,
    suggestedRecoveryDays: offsets.map((offset) => `${formatWeekday(addDays(new Date(), offset))} recovery emphasis`),
  };
}

export function generateAiCoachChat(
  message: string,
  data: AiCoachDataPoints,
  summary: AiCoachSummary = generateAiCoachSummary(data)
): AiCoachChatResponse {
  const workoutResponse = buildWorkoutCoachReply(message, data, summary);
  if (workoutResponse) {
    return workoutResponse;
  }
  const normalized = message.toLowerCase();

  if (/(recover|rest|day off|deload|sore|fatigue)/.test(normalized)) {
    return {
      reply: summary.recovery.recommendRecoveryDay
        ? `Your recovery score is ${summary.recovery.recoveryScore}/100, so I would use a lighter day. Prioritize mobility, easy cardio, hydration, and a protein-forward meal instead of another hard session.`
        : `Your recovery score is ${summary.recovery.recoveryScore}/100, so a full rest day is optional. Keep training moderate, avoid max-effort work, and monitor soreness and sleep tonight.`,
      followUps: ['What should my recovery workout look like?', 'How can I reduce soreness?'],
    };
  }

  if (/(stress|overwhelm|anxious|burnout|tired)/.test(normalized)) {
    return {
      reply: `Stress is reading ${summary.stress.level} right now. The biggest signal is ${summary.stress.markers[0].toLowerCase()} Focus on easier sessions, hydration, and a consistent sleep window for the next 24 to 48 hours.`,
      followUps: ['How hard should I train today?', 'What can I do tonight to recover better?'],
    };
  }

  if (/(eat|meal|nutrition|protein|calorie|water|hydration)/.test(normalized)) {
    const proteinGap = Math.max(0, Math.round(data.nutrition.proteinGoal - data.nutrition.protein));
    const waterGap = Math.max(0, data.nutrition.waterGoal - data.nutrition.waterMl);

    return {
      reply: `For recovery, keep protein and hydration as the priority. You still have about ${proteinGap} g of protein and ${waterGap} mL of water available before hitting today's targets. Build the next meal around lean protein, easy carbs, and fluids.`,
      followUps: ['What should I eat after training?', 'How much water do I still need today?'],
    };
  }

  if (/(workout|train|exercise|lift|cardio|session)/.test(normalized)) {
    return {
      reply:
        summary.recovery.recommendRecoveryDay || summary.stress.level === 'high'
          ? 'Keep today low impact: 20 to 30 minutes of walking or cycling, mobility, and technique work. Save heavy lifting for when recovery and stress markers improve.'
          : 'You look ready for a productive session. Use a main strength block, keep volume controlled, and stop one or two reps before failure on most sets.',
      followUps: ['Should I push intensity today?', 'Give me a recovery-focused session'],
    };
  }

  if (/(gain muscle|build muscle|muscle gain|bulk|hypertrophy|get bigger|size up)/.test(normalized)) {
    const proteinGap = Math.max(0, Math.round(data.nutrition.proteinGoal - data.nutrition.protein));
    const calorieGap = Math.max(0, Math.round(data.nutrition.calorieGoal - data.nutrition.calories));

    return {
      reply: `To gain muscle, focus on progressive overload, enough total calories, and daily protein. You are about ${proteinGap} g protein and ${calorieGap} kcal short of today's targets, so build your next meal around lean protein, carbs, and a solid lifting session.`,
      followUps: ['Give me a muscle gain workout', 'What should I eat to bulk cleanly?'],
    };
  }

  if (/(hello|hi|hey)/.test(normalized)) {
    return {
      reply: `Hi ${data.userName}, I'm tracking your recovery, stress, workouts, and nutrition. Ask me about training intensity, recovery days, stress management, or what to eat today.`,
      followUps: ['Should I take a recovery day?', 'How do I lower stress from training?'],
    };
  }

  return {
    reply: `Here's the coaching read right now: recovery is ${summary.recovery.recoveryScore}/100 and stress is ${summary.stress.level}. Ask about workouts, meals, soreness, or stress and I'll tailor the advice.`,
    followUps: ['How hard should I train today?', 'What should I eat today?'],
  };
}
