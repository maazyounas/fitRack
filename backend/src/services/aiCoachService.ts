import OpenAI from 'openai';
import { env } from '../config/env';

type CoachingSnapshot = {
  userName: string;
  dailyCalories?: number | null;
  notificationsEnabled: boolean;
  recentWorkouts: Array<{
    name: string;
    completionRate: number;
    missedCount: number;
    updatedAt: Date;
    exercises?: Array<{
      name: string;
      sets: number;
      reps: number;
      intensity: string;
    }>;
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

const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

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

export async function answerCoachQuestion(snapshot: CoachingSnapshot, message: string) {
  if (openai) {
    try {
      const summary = buildCoachSummary(snapshot);
      const systemPrompt = `You are the FITRACK AI Coach, a highly motivating and data-driven fitness expert.
Your goal is to provide personalized coaching based on the user's data.

User Profile:
- Name: ${snapshot.userName}
- Daily Calories: ${snapshot.dailyCalories ?? 'Not set'}
- Adherence: ${snapshot.progress.streakDays} day streak

Current Status:
- Recovery Score: ${summary.recovery.recoveryScore}/100
- Stress Level: ${summary.stress.level} (${summary.stress.stressScore}/100)
- Nutrition: ${snapshot.nutrition.calories}/${snapshot.nutrition.calorieGoal} kcal, ${snapshot.nutrition.protein}/${snapshot.nutrition.proteinGoal}g protein
- Hydration: ${snapshot.nutrition.waterMl}/${snapshot.nutrition.waterGoal} mL

Recent Workouts:
${snapshot.recentWorkouts.map(w => `- ${w.name}: ${Math.round(w.completionRate * 100)}% completion, ${w.missedCount} missed`).join('\n')}

Guidelines:
1. Be concise but encouraging.
2. If the user asks about training while their recovery score is low (< 50), strongly advise active recovery.
3. If they are missing protein targets, suggest specific food ideas.
4. If they are on a streak, celebrate it!
5. ALWAYS format your response with a clear 'reply' and provide exactly 2 relevant 'followUps' as a JSON-like structure.

Example Response Format:
{
  "reply": "Your 5-day streak is amazing, ${snapshot.userName}! Your recovery is at 85, so you're primed for a heavy session today.",
  "followUps": ["Suggest a workout?", "Check my protein target?"]
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' }
      });

      const content = JSON.parse(response.choices[0].message.content || '{}');
      return {
        reply: content.reply || "I'm having trouble analyzing the data right now, but stay consistent!",
        followUps: content.followUps || ['How is my recovery?', 'Need meal ideas.']
      };
    } catch (error) {
      console.error('OpenAI Error:', error);
    }
  }

  // Fallback Rule-Based Logic
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

export function getWorkoutIntensityRecommendation(snapshot: CoachingSnapshot) {
  const highPerformance = snapshot.progress.performanceScore > 100;
  const consistentAdherence = snapshot.recentWorkouts.every(w => w.completionRate > 0.8);
  const goodRecovery = analyzeRecovery(snapshot).recoveryScore > 75;

  if (consistentAdherence && goodRecovery) {
    return {
      action: 'increase',
      value: 5,
      unit: '%',
      reason: 'Your recovery and adherence are peak. Time for progressive overload.',
      banner: '🚀 Performance Boost: Increase your weights by 5% this session.'
    };
  }

  if (analyzeRecovery(snapshot).recommendRecoveryDay) {
    return {
      action: 'decrease',
      value: 10,
      unit: '%',
      reason: 'Recovery indicators are low. Focus on form and mobility.',
      banner: '🧘 Recovery Alert: Drop intensity by 10% to prevent burnout.'
    };
  }

  return {
    action: 'maintain',
    reason: 'Steady progress. Keep hitting your current targets.',
    banner: '✅ Stay Consistent: Your current training intensity is optimal.'
  };
}

export function getWeeklyInsights(snapshot: CoachingSnapshot) {
  const missedWorkouts = snapshot.recentWorkouts.reduce((sum, workout) => sum + workout.missedCount, 0);
  const streak = snapshot.progress.streakDays;

  const insights = [];
  if (missedWorkouts > 1) {
    insights.push({
      type: 'warning',
      text: `You missed ${missedWorkouts} workouts. Try scheduling evening sessions if mornings are too busy.`,
    });
  } else if (streak > 3) {
    insights.push({
      type: 'celebration',
      text: `A ${streak}-day streak! You're building incredible momentum.`,
    });
  }

  if (snapshot.nutrition.calories < snapshot.nutrition.calorieGoal * 0.8) {
    insights.push({
      type: 'nutrition',
      text: 'You are under-fueling. Add a carbohydrate-dense snack pre-workout.',
    });
  }

  return insights.slice(0, 3);
}

