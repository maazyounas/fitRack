import { z } from 'zod';

export const logProgressSchema = z.object({
  weightKg: z.number().min(20).max(500).optional(),
  bodyFatPercent: z.number().min(1).max(60).optional(),
  workoutVolumeKg: z.number().min(0).optional(),
  exercises: z.array(z.object({
    name: z.string().min(1),
    sets: z.number().int().min(1),
    reps: z.number().int().min(1),
    weightKg: z.number().min(0),
  })).optional(),
  measurements: z.object({
    waistCm: z.number().min(20).max(300).optional(),
    chestCm: z.number().min(20).max(300).optional(),
    hipsCm: z.number().min(20).max(300).optional(),
    bicepsCm: z.number().min(5).max(100).optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
});

export const progressChartQuerySchema = z.object({
  period: z.enum(['30', '90', '180']).default('30'),
  metric: z.enum(['weight', 'volume', 'measurements']).default('weight'),
});
