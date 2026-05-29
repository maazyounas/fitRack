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
    demoVideos: [{ title: 'Push-Up Demo', url: 'https://www.youtube.com/embed/IODxDxX7oi4' }],
  },
  {
    name: 'Bench Press',
    description: 'A barbell pressing exercise for developing chest strength.',
    muscleGroup: 'Chest',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'intermediate',
    equipment: 'Barbell',
    instructions: [
      'Lie flat on the bench with feet firmly on the floor.',
      'Grip the bar slightly wider than shoulder-width.',
      'Lower the bar to your chest, then press upward explosively.',
      'Control the weight back down and repeat.',
    ],
    demoVideos: [{ title: 'Bench Press Demo', url: 'https://www.youtube.com/embed/rT7DgCr-3pg' }],
  },
  {
    name: 'Dumbbell Flyes',
    description: 'An isolation exercise for chest strength and stretch.',
    muscleGroup: 'Chest',
    targetMuscles: ['Chest', 'Shoulders'],
    difficulty: 'intermediate',
    equipment: 'Dumbbells',
    instructions: [
      'Lie on a flat bench with dumbbells above your chest.',
      'With a slight bend in your elbows, lower the weights in an arc.',
      'Feel the stretch across your chest, then return to the starting position.',
    ],
    demoVideos: [{ title: 'Dumbbell Flyes Demo', url: 'https://www.youtube.com/embed/eozdVT5HSEA' }],
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
    demoVideos: [{ title: 'Goblet Squat Demo', url: 'https://www.youtube.com/embed/MeIiIdhvXT4' }],
  },
  {
    name: 'Barbell Squat',
    description: 'A compound lower body exercise with barbell on shoulders.',
    muscleGroup: 'Legs',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    difficulty: 'intermediate',
    equipment: 'Barbell',
    instructions: [
      'Position the bar across your upper back with feet shoulder-width apart.',
      'Keep your chest up and core tight.',
      'Descend by bending your hips and knees until thighs are parallel.',
      'Drive through your heels to return to standing position.',
    ],
    demoVideos: [{ title: 'Barbell Squat Demo', url: 'https://www.youtube.com/embed/xvKvGU06N7Q' }],
  },
  {
    name: 'Leg Press',
    description: 'A machine-based lower body pressing exercise.',
    muscleGroup: 'Legs',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    difficulty: 'beginner',
    equipment: 'Leg Press Machine',
    instructions: [
      'Sit in the machine with feet on the platform about shoulder-width apart.',
      'Lower the weight by bending your knees to about 90 degrees.',
      'Press through your heels to extend your legs back to the starting position.',
    ],
    demoVideos: [{ title: 'Leg Press Demo', url: 'https://www.youtube.com/embed/Z2II0jZieFM' }],
  },
  {
    name: 'Leg Curl',
    description: 'An isolation exercise for hamstring strength.',
    muscleGroup: 'Legs',
    targetMuscles: ['Hamstrings'],
    difficulty: 'beginner',
    equipment: 'Leg Curl Machine',
    instructions: [
      'Lie face down on the leg curl machine with legs straight.',
      'Curl your heels toward your glutes, bending at the knees.',
      'Pause at the top, then slowly lower back to the starting position.',
    ],
    demoVideos: [{ title: 'Leg Curl Demo', url: 'https://www.youtube.com/embed/ELOjcNi7N4o' }],
  },
  {
    name: 'Barbell Deadlift',
    description: 'A compound pulling movement focused on total-body strength.',
    muscleGroup: 'Back',
    targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
    difficulty: 'advanced',
    equipment: 'Barbell',
    instructions: [
      'Stand with your midfoot under the bar and hinge down to grip it.',
      'Brace your core, flatten your back, and push the floor away.',
      'Lock out at the top, then lower the bar under control.',
    ],
    demoVideos: [{ title: 'Deadlift Demo', url: 'https://www.youtube.com/embed/op9kVnSso6Q' }],
  },
  {
    name: 'Bent Over Rows',
    description: 'A compound back exercise using a barbell.',
    muscleGroup: 'Back',
    targetMuscles: ['Lats', 'Upper Back', 'Biceps', 'Lower Back'],
    difficulty: 'intermediate',
    equipment: 'Barbell',
    instructions: [
      'Bend your hips and knees with the bar at hip height.',
      'Keep your back straight and pull the bar to your lower chest.',
      'Squeeze your shoulder blades together, then lower with control.',
    ],
    demoVideos: [{ title: 'Bent Over Rows Demo', url: 'https://www.youtube.com/embed/5DHIeFTcqBA' }],
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
    demoVideos: [{ title: 'Lat Pulldown Demo', url: 'https://www.youtube.com/embed/CAwf7n6Luuc' }],
  },
  {
    name: 'Pull-ups',
    description: 'A bodyweight pulling exercise for back and arm strength.',
    muscleGroup: 'Back',
    targetMuscles: ['Lats', 'Upper Back', 'Biceps', 'Shoulders'],
    difficulty: 'intermediate',
    equipment: 'Pull-up Bar',
    instructions: [
      'Grip the bar with hands slightly wider than shoulder-width.',
      'Pull your body upward by driving your elbows down.',
      'Bring your chest toward the bar, then lower with control.',
    ],
    demoVideos: [{ title: 'Pull-ups Demo', url: 'https://www.youtube.com/embed/eJGh9z6Ci-s' }],
  },
  {
    name: 'Bicep Curls',
    description: 'An isolation exercise for bicep development.',
    muscleGroup: 'Arms',
    targetMuscles: ['Biceps'],
    difficulty: 'beginner',
    equipment: 'Dumbbells',
    instructions: [
      'Stand with dumbbells at your sides, palms facing forward.',
      'Curl the weights toward your shoulders while keeping elbows stationary.',
      'Squeeze at the top, then lower with control.',
    ],
    demoVideos: [{ title: 'Bicep Curls Demo', url: 'https://www.youtube.com/embed/rm2BjhXb1pE' }],
  },
  {
    name: 'Tricep Dips',
    description: 'A bodyweight pressing exercise for triceps.',
    muscleGroup: 'Arms',
    targetMuscles: ['Triceps', 'Chest', 'Shoulders'],
    difficulty: 'intermediate',
    equipment: 'Dip Station',
    instructions: [
      'Position yourself on parallel bars with arms extended.',
      'Lower your body by bending your elbows until your upper arms are parallel to the ground.',
      'Press back up to the starting position.',
    ],
    demoVideos: [{ title: 'Tricep Dips Demo', url: 'https://www.youtube.com/embed/Jn4ylKmB2OU' }],
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
    demoVideos: [{ title: 'Shoulder Press Demo', url: 'https://www.youtube.com/embed/qEwKCR5JCog' }],
  },
  {
    name: 'Lateral Raises',
    description: 'An isolation exercise for shoulder development.',
    muscleGroup: 'Shoulders',
    targetMuscles: ['Deltoids'],
    difficulty: 'beginner',
    equipment: 'Dumbbells',
    instructions: [
      'Stand with dumbbells at your sides, palms facing inward.',
      'Raise the dumbbells out to the sides until your arms are parallel to the ground.',
      'Lower with control back to the starting position.',
    ],
    demoVideos: [{ title: 'Lateral Raises Demo', url: 'https://www.youtube.com/embed/1bwZ0uu5g3Q' }],
  },
  {
    name: 'Face Pulls',
    description: 'A cable exercise for rear shoulders and upper back.',
    muscleGroup: 'Shoulders',
    targetMuscles: ['Rear Deltoids', 'Upper Back'],
    difficulty: 'beginner',
    equipment: 'Cable Machine',
    instructions: [
      'Set the rope at face height on a cable machine.',
      'Pull the rope toward your face, spreading it wide at the end.',
      'Squeeze your shoulder blades, then slowly return to the starting position.',
    ],
    demoVideos: [{ title: 'Face Pulls Demo', url: 'https://www.youtube.com/embed/E88A7PkiYOg' }],
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
    demoVideos: [{ title: 'Plank Demo', url: 'https://www.youtube.com/embed/pSHjTRCQxIw' }],
  },
  {
    name: 'Crunches',
    description: 'A core exercise focusing on abdominal muscles.',
    muscleGroup: 'Core',
    targetMuscles: ['Abdominals'],
    difficulty: 'beginner',
    equipment: 'Bodyweight',
    instructions: [
      'Lie on your back with knees bent and feet on the floor.',
      'Place your hands behind your head without pulling your neck.',
      'Curl your upper body toward your knees, then lower back down.',
    ],
    demoVideos: [{ title: 'Crunches Demo', url: 'https://www.youtube.com/embed/udBwiH22466' }],
  },
  {
    name: 'Russian Twists',
    description: 'A rotational core exercise for obliques.',
    muscleGroup: 'Core',
    targetMuscles: ['Obliques', 'Abdominals'],
    difficulty: 'intermediate',
    equipment: 'Medicine Ball',
    instructions: [
      'Sit on the floor with knees bent and feet elevated.',
      'Hold a medicine ball at chest level and lean back slightly.',
      'Rotate your torso side to side, tapping the medicine ball to each side.',
    ],
    demoVideos: [{ title: 'Russian Twists Demo', url: 'https://www.youtube.com/embed/wObLm05YEiE' }],
  },
  {
    name: 'Running',
    description: 'A cardiovascular exercise for endurance and fat loss.',
    muscleGroup: 'Cardio',
    targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
    difficulty: 'beginner',
    equipment: 'None',
    instructions: [
      'Start with a warm-up walk for 5 minutes.',
      'Maintain a steady pace where you can still hold a conversation.',
      'Run for 20-30 minutes, then cool down with a walk.',
    ],
    demoVideos: [{ title: 'Running Form Demo', url: 'https://www.youtube.com/embed/pQ5l9B7yZqE' }],
  },
  {
    name: 'Burpees',
    description: 'A full-body explosive exercise for cardio and strength.',
    muscleGroup: 'Cardio',
    targetMuscles: ['Chest', 'Arms', 'Legs', 'Core'],
    difficulty: 'advanced',
    equipment: 'Bodyweight',
    instructions: [
      'Start in a standing position.',
      'Lower down to a push-up position, perform one push-up.',
      'Jump your feet back to standing position and jump up explosively.',
    ],
    demoVideos: [{ title: 'Burpees Demo', url: 'https://www.youtube.com/embed/JZRIDE_MNNA' }],
  },
  {
    name: 'Jump Rope',
    description: 'A cardio exercise for endurance and coordination.',
    muscleGroup: 'Cardio',
    targetMuscles: ['Calves', 'Shoulders', 'Core'],
    difficulty: 'beginner',
    equipment: 'Jump Rope',
    instructions: [
      'Hold the rope at waist height with handles at your sides.',
      'Jump with both feet, rotating the rope overhead.',
      'Maintain a steady rhythm for 30-60 seconds.',
    ],
    demoVideos: [{ title: 'Jump Rope Demo', url: 'https://www.youtube.com/embed/oDXhLW_hXKU' }],
  },
] as const;

let defaultExercisesSeedPromise: Promise<void> | null = null;

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
  if (!defaultExercisesSeedPromise) {
    defaultExercisesSeedPromise = (async () => {
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

      await ExerciseModel.bulkWrite(
        defaultExercises.map((exercise) => {
          const exerciseDocument = {
            ...exercise,
            targetMuscles: [...exercise.targetMuscles],
            instructions: [...exercise.instructions],
            demoVideos: exercise.demoVideos.map((video) => ({ ...video })),
            slug: slugify(exercise.name),
            createdBy: adminUser!._id,
            updatedBy: adminUser!._id,
          };

          return {
            updateOne: {
              filter: { slug: exerciseDocument.slug },
              update: { $setOnInsert: exerciseDocument },
              upsert: true,
            },
          };
        }) as any
      );
    })().finally(() => {
      defaultExercisesSeedPromise = null;
    });
  }

  return defaultExercisesSeedPromise;
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

export async function getFavoriteExercises(req: AuthedRequest, res: Response) {
  const userId = req.userId!;
  const exercises = await ExerciseModel.find({ favoriteUserIds: userId }).sort({ name: 1 });
  res.json({ exercises: exercises.map((exercise) => serializeExercise(exercise, userId)) });
}
