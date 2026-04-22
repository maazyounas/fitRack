export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseIntensity = 'low' | 'moderate' | 'high';
export type WorkoutScheduleStatus = 'scheduled' | 'completed' | 'missed';

export type WorkoutExercise = {
  _id?: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets: number;
  reps: number;
  restSeconds: number;
  notes: string;
  intensity: ExerciseIntensity;
  order: number;
};

export type WorkoutScheduleEntry = {
  _id?: string;
  scheduledDate: string;
  status: WorkoutScheduleStatus;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  missedNotificationSent?: boolean;
};

export type WorkoutAiReview = {
  completionRate: number;
  outdated: boolean;
  intensityAdjustment: string;
  outdatedReason: string;
  exerciseVariations: Array<{
    exerciseName: string;
    suggestion: string;
  }>;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  difficulty: WorkoutDifficulty;
  isTemplate: boolean;
  sourceTemplateKey?: string;
  estimatedDurationMinutes: number;
  exercises: WorkoutExercise[];
  schedule: WorkoutScheduleEntry[];
  aiReview?: WorkoutAiReview;
  missedCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkoutTemplate = {
  id: string;
  key?: string;
  isSystemTemplate?: boolean;
  name: string;
  description: string;
  difficulty: WorkoutDifficulty;
  estimatedDurationMinutes: number;
  exercises: WorkoutExercise[];
};

export type WorkoutCreatePayload = {
  name: string;
  description: string;
  difficulty: WorkoutDifficulty;
  estimatedDurationMinutes: number;
  isTemplate?: boolean;
  sourceTemplateKey?: string;
  exercises: WorkoutExercise[];
};
