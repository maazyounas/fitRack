import { z } from 'zod';

export const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  muscleGroup: z.string().min(1, 'Muscle group is required'),
  equipment: z.string().optional().default('Bodyweight'),
  sets: z.number().int().min(1, 'sets must be at least 1'),
  reps: z.number().int().min(1, 'reps must be at least 1'),
  restSeconds: z.number().int().min(0, 'restSeconds must be 0 or greater'),
  notes: z.string().optional().default(''),
  intensity: z.enum(['low', 'moderate', 'high']),
  order: z.number().int().min(1),
  _id: z.string().optional(),
});

export const scheduleEntrySchema = z.object({
  scheduledDate: z.string().or(z.date()),
  status: z.enum(['scheduled', 'completed', 'missed']).optional().default('scheduled'),
  completed: z.boolean().optional().default(false),
  completedAt: z.string().or(z.date()).optional(),
  notes: z.string().optional().default(''),
  missedNotificationSent: z.boolean().optional().default(false),
});

export const createWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required'),
  description: z.string().optional().default(''),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedDurationMinutes: z
    .number()
    .int()
    .min(1, 'estimatedDurationMinutes must be a positive integer'),
  exercises: z.array(exerciseSchema).min(1, 'At least one exercise is required'),
  isTemplate: z.boolean().optional(),
  sourceTemplateKey: z.string().optional(),
  schedule: z.array(scheduleEntrySchema).optional(),
});

export const updateWorkoutSchema = createWorkoutSchema.partial();
