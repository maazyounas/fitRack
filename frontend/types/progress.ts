export type BodyMeasurements = {
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  bicepsCm: number;
  thighCm: number;
  bodyFatPercent: number;
  muscleMassKg: number;
};

export type GymPerformanceEntry = {
  id?: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  sets: number;
  oneRepMaxEstimate: number;
  notes: string;
};

export type ProgressEntry = {
  id: string;
  loggedAt: string;
  weightKg: number;
  measurements: BodyMeasurements;
  gymPerformance: GymPerformanceEntry[];
  notes: string;
};

export type ProgressAchievement = {
  key: string;
  title: string;
  description: string;
  unlockedAt: string;
};

export type ProgressTrendPoint = {
  date: string;
  label?: string;
  weightKg: number;
  bodyFatPercent: number;
  muscleMassKg: number;
  performanceScore: number;
};

export type ProgressDashboard = {
  entries: ProgressEntry[];
  streakDays: number;
  achievements: ProgressAchievement[];
  summary: {
    currentWeightKg: number;
    weightChangeKg: number;
    bodyFatTrend: number;
    muscleMassTrend: number;
    performanceTrend: number;
  };
  reports: {
    daily: ProgressTrendPoint[];
    weekly: ProgressTrendPoint[];
    monthly: ProgressTrendPoint[];
  };
};

export type ProgressPayload = {
  loggedAt: string;
  weightKg: number;
  measurements: BodyMeasurements;
  gymPerformance: {
    exerciseName: string;
    weightKg: number;
    reps: number;
    sets: number;
    notes: string;
  }[];
  notes: string;
};
