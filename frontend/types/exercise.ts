export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ExerciseVideo = {
  title: string;
  url: string;
};

export type ExerciseComment = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Exercise = {
  id: string;
  name: string;
  slug: string;
  description: string;
  muscleGroup: string;
  targetMuscles: string[];
  difficulty: ExerciseDifficulty;
  equipment: string;
  instructions: string[];
  demoVideos: ExerciseVideo[];
  ratingAverage: number;
  ratingCount: number;
  currentUserRating: number | null;
  isFavorite: boolean;
  favoriteCount: number;
  notes: string;
  comments: ExerciseComment[];
  createdAt?: string;
  updatedAt?: string;
};

export type ExerciseFilters = {
  muscleGroups: string[];
  difficulties: ExerciseDifficulty[];
  equipment: string[];
};

export type ExerciseQuery = {
  muscleGroup?: string;
  difficulty?: ExerciseDifficulty;
  equipment?: string;
  search?: string;
};

export type ExercisePayload = {
  name: string;
  description: string;
  muscleGroup: string;
  targetMuscles: string[];
  difficulty: ExerciseDifficulty;
  equipment: string;
  instructions: string[];
  demoVideos: ExerciseVideo[];
};
