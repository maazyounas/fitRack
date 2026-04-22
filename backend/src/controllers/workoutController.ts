import { Request, Response } from 'express';
import { WorkoutPlanModel } from '../models/WorkoutPlan';
import { HttpError } from '../utils/http';
import { analyzeWorkoutPlan } from '../services/workoutAiService';

const systemTemplates = [
  {
    key: 'beginner-full-body',
    name: 'Beginner Full Body',
    description: 'A simple three-day split for building consistency.',
    difficulty: 'beginner',
    estimatedDurationMinutes: 40,
    exercises: [
      {
        name: 'Goblet Squat',
        muscleGroup: 'Legs',
        equipment: 'Dumbbell',
        sets: 3,
        reps: 10,
        restSeconds: 60,
        notes: 'Stay controlled on the descent.',
        intensity: 'low',
        order: 1,
      },
      {
        name: 'Incline Push-Up',
        muscleGroup: 'Chest',
        equipment: 'Bench',
        sets: 3,
        reps: 12,
        restSeconds: 45,
        notes: 'Elevate hands if needed.',
        intensity: 'low',
        order: 2,
      },
      {
        name: 'Seated Row',
        muscleGroup: 'Back',
        equipment: 'Cable',
        sets: 3,
        reps: 12,
        restSeconds: 60,
        notes: 'Pause at full contraction.',
        intensity: 'moderate',
        order: 3,
      },
    ],
  },
  {
    key: 'intermediate-upper-lower',
    name: 'Intermediate Upper/Lower',
    description: 'Balanced weekly split for strength and hypertrophy.',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 55,
    exercises: [
      {
        name: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        equipment: 'Barbell',
        sets: 4,
        reps: 8,
        restSeconds: 90,
        notes: 'Drive feet into the floor.',
        intensity: 'moderate',
        order: 1,
      },
      {
        name: 'Romanian Deadlift',
        muscleGroup: 'Posterior Chain',
        equipment: 'Barbell',
        sets: 4,
        reps: 8,
        restSeconds: 90,
        notes: 'Keep lats engaged.',
        intensity: 'moderate',
        order: 2,
      },
      {
        name: 'Lat Pulldown',
        muscleGroup: 'Back',
        equipment: 'Machine',
        sets: 3,
        reps: 10,
        restSeconds: 60,
        notes: 'Control the eccentric.',
        intensity: 'moderate',
        order: 3,
      },
    ],
  },
  {
    key: 'advanced-performance',
    name: 'Advanced Performance',
    description: 'High-intensity routine with varied compound loading.',
    difficulty: 'advanced',
    estimatedDurationMinutes: 70,
    exercises: [
      {
        name: 'Front Squat',
        muscleGroup: 'Legs',
        equipment: 'Barbell',
        sets: 5,
        reps: 5,
        restSeconds: 120,
        notes: 'Maintain upright torso.',
        intensity: 'high',
        order: 1,
      },
      {
        name: 'Weighted Pull-Up',
        muscleGroup: 'Back',
        equipment: 'Pull-Up Bar',
        sets: 5,
        reps: 6,
        restSeconds: 120,
        notes: 'Full hang between reps.',
        intensity: 'high',
        order: 2,
      },
      {
        name: 'Push Press',
        muscleGroup: 'Shoulders',
        equipment: 'Barbell',
        sets: 4,
        reps: 6,
        restSeconds: 90,
        notes: 'Use leg drive to finish overhead.',
        intensity: 'high',
        order: 3,
      },
    ],
  },
] as const;

function normalizePlan(plan: any) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    difficulty: plan.difficulty,
    isTemplate: plan.isTemplate,
    sourceTemplateKey: plan.sourceTemplateKey,
    estimatedDurationMinutes: plan.estimatedDurationMinutes,
    exercises: plan.exercises,
    schedule: plan.schedule,
    aiReview: plan.aiReview,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

function getMissedWorkouts(schedule: any[]) {
  return schedule.filter(
    (entry) => !entry.completed && entry.status !== 'completed' && new Date(entry.scheduledDate).getTime() < Date.now()
  );
}

export async function listWorkoutPlans(req: Request & { userId?: string }, res: Response) {
  const plans = await WorkoutPlanModel.find({ ownerId: req.userId }).sort({ updatedAt: -1 });

  res.json({
    workouts: plans.map((plan) => {
      const missedCount = getMissedWorkouts(plan.schedule).length;
      return {
        ...normalizePlan(plan),
        missedCount,
      };
    }),
  });
}

export async function listWorkoutTemplates(req: Request & { userId?: string }, res: Response) {
  const userTemplates = await WorkoutPlanModel.find({
    ownerId: req.userId,
    isTemplate: true,
  }).sort({ updatedAt: -1 });

  res.json({
    templates: [
      ...systemTemplates.map((template) => ({
        id: template.key,
        isSystemTemplate: true,
        ...template,
      })),
      ...userTemplates.map((template) => ({
        isSystemTemplate: false,
        ...normalizePlan(template),
      })),
    ],
  });
}

export async function getWorkoutPlan(req: Request & { userId?: string }, res: Response) {
  const plan = await WorkoutPlanModel.findOne({
    _id: req.params.id,
    ownerId: req.userId,
  });

  if (!plan) {
    throw new HttpError(404, 'Workout plan not found.');
  }

  res.json({ workout: normalizePlan(plan) });
}

export async function createWorkoutPlan(req: Request & { userId?: string }, res: Response) {
  const payload = req.body;
  if (!payload.name || !Array.isArray(payload.exercises) || payload.exercises.length === 0) {
    throw new HttpError(400, 'Workout name and at least one exercise are required.');
  }

  const plan = await WorkoutPlanModel.create({
    ownerId: req.userId,
    name: payload.name,
    description: payload.description ?? '',
    difficulty: payload.difficulty ?? 'beginner',
    isTemplate: Boolean(payload.isTemplate),
    sourceTemplateKey: payload.sourceTemplateKey ?? '',
    estimatedDurationMinutes: payload.estimatedDurationMinutes ?? 45,
    exercises: payload.exercises,
    schedule: payload.schedule ?? [],
  });

  res.status(201).json({ workout: normalizePlan(plan) });
}

export async function updateWorkoutPlan(req: Request & { userId?: string }, res: Response) {
  const plan = await WorkoutPlanModel.findOne({
    _id: req.params.id,
    ownerId: req.userId,
  });

  if (!plan) {
    throw new HttpError(404, 'Workout plan not found.');
  }

  const fields = [
    'name',
    'description',
    'difficulty',
    'estimatedDurationMinutes',
    'isTemplate',
    'sourceTemplateKey',
  ] as const;

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      (plan as any)[field] = req.body[field];
    }
  }

  if (Array.isArray(req.body.exercises)) {
    plan.exercises = req.body.exercises;
  }

  if (Array.isArray(req.body.schedule)) {
    plan.schedule = req.body.schedule;
  }

  await plan.save();
  res.json({ workout: normalizePlan(plan) });
}

export async function deleteWorkoutPlan(req: Request & { userId?: string }, res: Response) {
  const result = await WorkoutPlanModel.deleteOne({
    _id: req.params.id,
    ownerId: req.userId,
  });

  if (!result.deletedCount) {
    throw new HttpError(404, 'Workout plan not found.');
  }

  res.json({ message: 'Workout plan deleted.' });
}

export async function scheduleWorkoutPlan(req: Request & { userId?: string }, res: Response) {
  const plan = await WorkoutPlanModel.findOne({
    _id: req.params.id,
    ownerId: req.userId,
  });

  if (!plan) {
    throw new HttpError(404, 'Workout plan not found.');
  }

  const { scheduledDate } = req.body as { scheduledDate?: string };
  if (!scheduledDate) {
    throw new HttpError(400, 'Scheduled date is required.');
  }

  plan.schedule.push({
    scheduledDate: new Date(scheduledDate),
    status: 'scheduled',
    completed: false,
  } as any);

  await plan.save();
  res.json({ workout: normalizePlan(plan) });
}

export async function markWorkoutCompleted(req: Request & { userId?: string }, res: Response) {
  const plan = await WorkoutPlanModel.findOne({
    _id: req.params.id,
    ownerId: req.userId,
  });

  if (!plan) {
    throw new HttpError(404, 'Workout plan not found.');
  }

  const { scheduleEntryId } = req.body as { scheduleEntryId?: string };
  const scheduleEntry = plan.schedule.find((entry: any) => entry.id === scheduleEntryId);

  if (!scheduleEntry) {
    throw new HttpError(404, 'Scheduled workout not found.');
  }

  scheduleEntry.completed = true;
  scheduleEntry.status = 'completed';
  scheduleEntry.completedAt = new Date();

  await plan.save();
  res.json({ workout: normalizePlan(plan) });
}

export async function getWorkoutAiReview(req: Request & { userId?: string }, res: Response) {
  const plan = await WorkoutPlanModel.findOne({
    _id: req.params.id,
    ownerId: req.userId,
  });

  if (!plan) {
    throw new HttpError(404, 'Workout plan not found.');
  }

  const aiReview = analyzeWorkoutPlan({
    name: plan.name,
    updatedAt: plan.updatedAt,
    exercises: plan.exercises as any,
    schedule: plan.schedule as any,
  });

  plan.aiReview = aiReview as any;
  plan.schedule = plan.schedule.map((entry: any) => {
    if (!entry.completed && new Date(entry.scheduledDate).getTime() < Date.now()) {
      entry.status = 'missed';
      entry.missedNotificationSent = true;
    }
    return entry;
  }) as any;

  await plan.save();

  res.json({
    aiReview,
    missedWorkouts: getMissedWorkouts(plan.schedule).map((entry: any) => ({
      id: entry.id,
      scheduledDate: entry.scheduledDate,
      status: entry.status,
    })),
  });
}

export async function createWorkoutFromTemplate(req: Request & { userId?: string }, res: Response) {
  const { templateKey, editable = true } = req.body as {
    templateKey?: string;
    editable?: boolean;
  };

  const template = systemTemplates.find((entry) => entry.key === templateKey);
  if (!template) {
    throw new HttpError(404, 'Template not found.');
  }

  const plan = await WorkoutPlanModel.create({
    ownerId: req.userId,
    name: template.name,
    description: template.description,
    difficulty: template.difficulty,
    isTemplate: editable,
    sourceTemplateKey: template.key,
    estimatedDurationMinutes: template.estimatedDurationMinutes,
    exercises: template.exercises,
  });

  res.status(201).json({ workout: normalizePlan(plan) });
}
