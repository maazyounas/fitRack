import { ExerciseDifficulty, ExerciseVideo } from './exercise';
import { UserProfile, UserVerification } from './user';

export type AdminAnalytics = {
  users: {
    total: number;
    active: number;
    disabled: number;
    admins: number;
  };
  content: {
    exercises: number;
    communityPosts: number;
    communityComments: number;
    communityLikes: number;
    activeSessions: number;
    challenges: number;
  };
  challengeSnapshots: Array<{
    id: string;
    title: string;
    participantCount: number;
    startDate: string;
    endDate: string;
  }>;
};

export type AdminUser = {
  id: string;
  isAdmin: boolean;
  email?: string;
  phone?: string;
  profile: UserProfile;
  verification: UserVerification;
  deactivatedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminExercise = {
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
  favoriteCount: number;
  commentCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCommunityComment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email?: string;
  };
};

export type AdminCommunityPost = {
  id: string;
  content: string;
  challengeId?: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  author: {
    id: string;
    name: string;
    email?: string;
  };
  comments: AdminCommunityComment[];
};

export type AdminRequestLog = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ipAddress: string;
  userId?: string;
  timestamp: string;
};

export type AdminApiError = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  stack?: string;
  userId?: string;
  timestamp: string;
};

export type AdminDashboard = {
  analytics: AdminAnalytics;
  users: AdminUser[];
  exercises: AdminExercise[];
  communityPosts: AdminCommunityPost[];
  system: {
    requestLogs: AdminRequestLog[];
    apiErrors: AdminApiError[];
  };
};
