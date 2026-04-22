import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ExerciseModel } from '../models/Exercise';
import { UserModel } from '../models/User';
import { HttpError } from '../utils/http';

type AuthedRequest = Request & { userId?: string; isAdmin?: boolean };

const defaultExercises = [
  {
    name: 'Push-Up',
    description: 'A bodyweight pressing exercise for upper-body strength.',
    muscleGroup: 'Chest',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'beginner',
    equipment: 'Bodyweight',
    instructions: [
      'Start in a high plank with your hands directly under your shoulders.',
      'Lower your chest toward the floor while keeping your body in a straight line.',
      'Press through your palms to return to the starting position.',
    ],
    demoVideos: [{ title: 'Push-Up Demo', url: 'https://www.youtube.com/watch?v=IODxDxX7oi4' }],
  },
  {
    name: 'Goblet Squat',
    description: 'A squat variation that builds lower-body strength and posture.',
    muscleGroup: 'Legs',
    targetMuscles: ['Quadriceps', 'Glutes', 'Core'],
    difficulty: 'beginner',
    equipment: 'Dumbbell',
    instructions: [
      'Hold a dumbbell vertically at your chest.',
      'Sit your hips back and bend your knees until your thighs are at least parallel.',
      'Drive through your feet to stand tall again.',
    ],
    demoVideos: [{ title: 'Goblet Squat Demo', url: 'https://www.youtube.com/watch?v=MeIiIdhvXT4' }],
  },
  {
    name: 'Barbell Deadlift',
    description: 'A compound pulling movement focused on total-body strength.',
    muscleGroup: 'Posterior Chain',
    targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
    difficulty: 'advanced',
    equipment: 'Barbell',
    instructions: [
      'Stand with your midfoot under the bar and hinge down to grip it.',
      'Brace your core, flatten your back, and push the floor away.',
      'Lock out at the top, then lower the bar under control.',
    ],
    demoVideos: [{ title: 'Deadlift Demo', url: 'https://www.youtube.com/watch?v=op9kVnSso6Q' }],
  },
  {
    name: 'Lat Pulldown',
    description: 'A vertical pulling exercise for developing back width.',
    muscleGroup: 'Back',
    targetMuscles: ['Lats', 'Upper Back', 'Biceps'],
    difficulty: 'intermediate',
    equipment: 'Cable Machine',
    instructions: [
      'Sit tall and grip the bar slightly wider than shoulder-width.',
      'Pull the bar toward your upper chest while driving your elbows down.',
      'Pause briefly, then return the bar with control.',
    ],
    demoVideos: [{ title: 'Lat Pulldown Demo', url: 'https://www.youtube.com/watch?v=CAwf7n6Luuc' }],
  },
  {
    name: 'Plank',
    description: 'An isometric core exercise for trunk stability.',
    muscleGroup: 'Core',
    targetMuscles: ['Abdominals', 'Obliques', 'Shoulders'],
    difficulty: 'beginner',
    equipment: 'Bodyweight',
    instructions: [
      'Set up on your forearms with your elbows under your shoulders.',
      'Lift your body into a straight line from head to heels.',
      'Keep your core tight and breathe steadily throughout the hold.',
    ],
    demoVideos: [{ title: 'Plank Demo', url: 'https://www.youtube.com/watch?v=pSHjTRCQxIw' }],
  },
  {
    name: 'Dumbbell Shoulder Press',
    description: 'A controlled overhead press for shoulder strength.',
    muscleGroup: 'Shoulders',
    targetMuscles: ['Deltoids', 'Triceps', 'Upper Chest'],
    difficulty: 'intermediate',
    equipment: 'Dumbbells',
    instructions: [
      'Sit or stand tall with dumbbells at shoulder height.',
      'Press the weights overhead until your arms are extended.',
      'Lower them back to shoulder level without losing control.',
    ],
    demoVideos: [{ title: 'Shoulder Press Demo', url: 'https://www.youtube.com/watch?v=qEwKCR5JCog' }],
  },
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueTrimmed(values: string[] = []) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function ensureDefaultExercises() {
  const count = await ExerciseModel.countDocuments();
  if (count > 0) {
    return;
  }

  let adminUser = await UserModel.findOne({ isAdmin: true });
  if (!adminUser) {
    adminUser = await UserModel.findOne().sort({ createdAt: 1 });
  }

  if (!adminUser) {
    return;
  }

  await ExerciseModel.insertMany(
    defaultExercises.map((exercise) => ({
      ...exercise,
      slug: slugify(exercise.name),
      createdBy: adminUser!._id,
      updatedBy: adminUser!._id,
    }))
  );
}

function getAverageRating(ratings: Array<{ score: number }>) {
  if (!ratings.length) {
    return 0;
  }

  const total = ratings.reduce((sum, rating) => sum + rating.score, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

function serializeExercise(exercise: any, userId?: string) {
  const favoriteUserIds = (exercise.favoriteUserIds ?? []).map((entry: any) => String(entry));
  const ratings = exercise.ratings ?? [];
  const currentUserRating = ratings.find((rating: any) => String(rating.userId) === userId);
  const currentUserNote = (exercise.userNotes ?? []).find((note: any) => String(note.userId) === userId);

  return {
    id: exercise.id,
    name: exercise.name,
    slug: exercise.slug,
    description: exercise.description,
    muscleGroup: exercise.muscleGroup,
    targetMuscles: exercise.targetMuscles,
    difficulty: exercise.difficulty,
    equipment: exercise.equipment,
    instructions: exercise.instructions,
    demoVideos: exercise.demoVideos,
    ratingAverage: getAverageRating(ratings),
    ratingCount: ratings.length,
    currentUserRating: currentUserRating?.score ?? null,
    isFavorite: userId ? favoriteUserIds.includes(userId) : false,
    favoriteCount: favoriteUserIds.length,
    notes: currentUserNote?.content ?? '',
    comments: (exercise.comments ?? []).map((comment: any) => ({
      id: comment.id,
      userId: String(comment.userId),
      userName: comment.userName,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    })),
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
  };
}

function buildExercisePayload(body: any) {
  const name = String(body.name ?? '').trim();
  const muscleGroup = String(body.muscleGroup ?? '').trim();

  if (!name || !muscleGroup) {
    throw new HttpError(400, 'Exercise name and muscle group are required.');
  }

  const instructions = Array.isArray(body.instructions)
    ? body.instructions.map((step: unknown) => String(step).trim()).filter(Boolean)
    : [];

  if (!instructions.length) {
    throw new HttpError(400, 'At least one instruction step is required.');
  }

  return {
    name,
    slug: slugify(name),
    description: String(body.description ?? '').trim(),
    muscleGroup,
    targetMuscles: uniqueTrimmed(
      Array.isArray(body.targetMuscles) ? body.targetMuscles.map((entry: unknown) => String(entry)) : []
    ),
    difficulty: body.difficulty ?? 'beginner',
    equipment: String(body.equipment ?? 'Bodyweight').trim() || 'Bodyweight',
    instructions,
    demoVideos: Array.isArray(body.demoVideos)
      ? body.demoVideos
          .map((video: any) => ({
            title: String(video?.title ?? '').trim(),
            url: String(video?.url ?? '').trim(),
          }))
          .filter((video: { title: string; url: string }) => video.title && video.url)
      : [],
  };
}

function ensureObjectId(value: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'Invalid resource id.');
  }
}

async function getExerciseOrThrow(id: string) {
  ensureObjectId(id);
  const exercise = await ExerciseModel.findById(id);
  if (!exercise) {
    throw new HttpError(404, 'Exercise not found.');
  }
  return exercise;
}

export async function listExercises(req: AuthedRequest, res: Response) {
  await ensureDefaultExercises();

  const { muscleGroup, difficulty, equipment, search } = req.query as Record<string, string | undefined>;
  const query: Record<string, any> = {};

  if (muscleGroup) {
    query.muscleGroup = muscleGroup;
  }

  if (difficulty) {
    query.difficulty = difficulty;
  }

  if (equipment) {
    query.equipment = equipment;
  }

  if (search?.trim()) {
    const pattern = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: pattern },
      { description: pattern },
      { muscleGroup: pattern },
      { targetMuscles: pattern },
    ];
  }

  const exercises = await ExerciseModel.find(query).sort({ muscleGroup: 1, name: 1 });
  res.json({ exercises: exercises.map((exercise) => serializeExercise(exercise, req.userId)) });
}

export async function getExerciseFilters(req: AuthedRequest, res: Response) {
  await ensureDefaultExercises();

  const [muscleGroups, equipmentOptions] = await Promise.all([
    ExerciseModel.distinct('muscleGroup'),
    ExerciseModel.distinct('equipment'),
  ]);

  res.json({
    filters: {
      muscleGroups: muscleGroups.sort(),
      difficulties: ['beginner', 'intermediate', 'advanced'],
      equipment: equipmentOptions.sort(),
    },
  });
}

export async function getExercise(req: AuthedRequest, res: Response) {
  const exercise = await getExerciseOrThrow(String(req.params.id));
  res.json({ exercise: serializeExercise(exercise, req.userId) });
}

export async function toggleFavorite(req: AuthedRequest, res: Response) {
  const exercise = await getExerciseOrThrow(String(req.params.id));
  const userId = req.userId!;
  const favorites = (exercise.favoriteUserIds ?? []).map((entry: any) => String(entry));
  const isFavorite = Boolean(req.body.isFavorite);

  if (isFavorite && !favorites.includes(userId)) {
    exercise.favoriteUserIds.push(new Types.ObjectId(userId));
  }

  if (!isFavorite) {
    exercise.favoriteUserIds = (exercise.favoriteUserIds ?? []).filter(
      (entry: any) => String(entry) !== userId
    ) as any;
  }

  await exercise.save();
  res.json({ exercise: serializeExercise(exercise, userId) });
}

export async function rateExercise(req: AuthedRequest, res: Response) {
  const exercise = await getExerciseOrThrow(String(req.params.id));
  const userId = req.userId!;
  const score = Number(req.body.score);

  if (!Number.isFinite(score) || score < 1 || score > 5) {
    throw new HttpError(400, 'A rating between 1 and 5 is required.');
  }

  const existing = exercise.ratings.find((rating: any) => String(rating.userId) === userId);
  if (existing) {
    existing.score = score;
    existing.updatedAt = new Date();
  } else {
    exercise.ratings.push({
      userId: new Types.ObjectId(userId),
      score,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }

  await exercise.save();
  res.json({ exercise: serializeExercise(exercise, userId) });
}

export async function saveExerciseNotes(req: AuthedRequest, res: Response) {
  const exercise = await getExerciseOrThrow(String(req.params.id));
  const userId = req.userId!;
  const content = String(req.body.content ?? '').trim();
  const existing = exercise.userNotes.find((note: any) => String(note.userId) === userId);

  if (existing) {
    existing.content = content;
    existing.updatedAt = new Date();
  } else {
    exercise.userNotes.push({
      userId: new Types.ObjectId(userId),
      content,
      updatedAt: new Date(),
    } as any);
  }

  await exercise.save();
  res.json({ exercise: serializeExercise(exercise, userId) });
}

export async function addExerciseComment(req: AuthedRequest, res: Response) {
  const exercise = await getExerciseOrThrow(String(req.params.id));
  const user = await UserModel.findById(req.userId);
  const content = String(req.body.content ?? '').trim();

  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  if (!content) {
    throw new HttpError(400, 'Comment content is required.');
  }

  exercise.comments.unshift({
    userId: user._id,
    userName: user.profile.name,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  await exercise.save();
  res.status(201).json({ exercise: serializeExercise(exercise, req.userId) });
}

export async function createExercise(req: AuthedRequest, res: Response) {
  const payload = buildExercisePayload(req.body);
  const duplicate = await ExerciseModel.findOne({ slug: payload.slug });

  if (duplicate) {
    throw new HttpError(409, 'An exercise with that name already exists.');
  }

  const exercise = await ExerciseModel.create({
    ...payload,
    createdBy: req.userId,
    updatedBy: req.userId,
  });

  res.status(201).json({ exercise: serializeExercise(exercise, req.userId) });
}

export async function updateExercise(req: AuthedRequest, res: Response) {
  const exercise = await getExerciseOrThrow(String(req.params.id));
  const payload = buildExercisePayload(req.body);
  const duplicate = await ExerciseModel.findOne({
    slug: payload.slug,
    _id: { $ne: exercise._id },
  });

  if (duplicate) {
    throw new HttpError(409, 'Another exercise already uses that name.');
  }

  Object.assign(exercise, payload, { updatedBy: req.userId });
  await exercise.save();

  res.json({ exercise: serializeExercise(exercise, req.userId) });
}

export async function deleteExercise(req: AuthedRequest, res: Response) {
  const exercise = await getExerciseOrThrow(String(req.params.id));
  await ExerciseModel.deleteOne({ _id: exercise._id });
  res.json({ message: 'Exercise deleted.' });
}
