export type AiCoachDataPoints = {
  userName: string;
  dailyCalories?: number | null;
  notificationsEnabled: boolean;
  recentWorkouts: {
    name: string;
    completionRate: number;
    missedCount: number;
    updatedAt: string;
  }[];
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

export type AiCoachSummary = {
  recovery: {
    recoveryScore: number;
    recommendRecoveryDay: boolean;
    suggestions: string[];
  };
  stress: {
    stressScore: number;
    level: 'low' | 'moderate' | 'high';
    markers: string[];
  };
  insights: string[];
  suggestedRecoveryDays: string[];
};

export type AiCoachChatResponse = {
  reply: string;
  followUps: string[];
};

export type AiCoachMessage = {
  id: string;
  role: 'user' | 'coach';
  text: string;
  followUps?: string[];
};
