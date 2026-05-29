import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/testDb';

process.env.MONGODB_URI = 'memory';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough';
process.env.FIELD_ENCRYPTION_KEY = 'test-32-char-encrypt-key!!!!!!!';

const AUTH = '/api/auth';
const WORKOUTS = '/api/workouts';

const TEST_USER = { name: 'Planner', email: 'planner@fitrack.test', password: 'PlanPass123!' };

let accessToken: string;

beforeAll(async () => { await connectTestDb(); });
afterAll(async () => { await disconnectTestDb(); });

import { UserModel } from '../models/User';
import { encryptValue, hashIdentifier } from '../utils/crypto';
import { hashPassword } from '../utils/password';

beforeEach(async () => {
  const passwordHash = await hashPassword(TEST_USER.password);
  await UserModel.create({
    emailEncrypted: encryptValue(TEST_USER.email),
    emailHash: hashIdentifier(TEST_USER.email),
    passwordHash,
    profile: { name: TEST_USER.name, dailyCalories: 2000 },
    verification: { emailVerified: true, phoneVerified: false, verifiedAt: new Date() },
  } as any);

  const res = await request(app)
    .post(`${AUTH}/login`)
    .send({ identifier: TEST_USER.email, password: TEST_USER.password });

  accessToken = res.body.accessToken;
});

afterEach(async () => { await clearTestDb(); });

describe('POST /api/workouts', () => {
  it('creates a workout plan and returns 201', async () => {
    const payload = {
      name: 'Test Plan',
      description: 'Created by test',
      difficulty: 'beginner',
      estimatedDurationMinutes: 30,
      exercises: [
        { name: 'Squat', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 10, restSeconds: 60, notes: '', intensity: 'moderate', order: 1 },
      ],
    };

    const res = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.workout).toHaveProperty('id');
    expect(res.body.workout.name).toBe(payload.name);
    expect(Array.isArray(res.body.workout.exercises)).toBe(true);
    expect(res.body.workout.exercises[0].name).toBe('Squat');
  });
});

import { WorkoutPlanModel } from '../models/WorkoutPlan';

// ============================================================
// PHASE 1 — EXPLORATION TESTS (expected to FAIL on unfixed code)
// These tests confirm the bugs exist. They SHOULD FAIL before fixes
// are applied, and SHOULD PASS after fixes are applied.
// ============================================================

// ------------------------------------------------------------
// Bug 3 — Silent Completion Skip
// EXPLORATION — expected to fail on fixed code
// ------------------------------------------------------------
describe('Bug 3 EXPLORATION — Silent completion skip (expected to fail on fixed code)', () => {
  it('POST /workouts/:id/complete with no scheduleEntryId on a workout with no schedule entries should return 200 (unfixed returns 404)', async () => {
    // Create a workout with NO schedule entries
    const createRes = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Unscheduled Workout',
        description: 'No schedule entries',
        difficulty: 'beginner',
        estimatedDurationMinutes: 30,
        exercises: [
          { name: 'Squat', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 10, restSeconds: 60, notes: '', intensity: 'moderate', order: 1 },
        ],
      });

    expect(createRes.status).toBe(201);
    const workoutId = createRes.body.workout.id;

    // Call POST /complete with NO body (no scheduleEntryId)
    // BUG: unfixed code throws 404 "Scheduled workout not found."
    // EXPECTED (after fix): 200 with an ad-hoc schedule entry created
    const completeRes = await request(app)
      .post(`${WORKOUTS}/${workoutId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    // This assertion FAILS on unfixed code (gets 404 instead of 200)
    // Counterexample: POST /complete with no scheduleEntryId → 404 instead of 200 with ad-hoc entry
    expect(completeRes.status).toBe(200);
  });
});

// ------------------------------------------------------------
// Bug 5 — GET with Side Effects
// EXPLORATION — expected to fail on fixed code
// ------------------------------------------------------------
describe('Bug 5 EXPLORATION — GET ai-review mutates DB (expected to fail on fixed code)', () => {
  it('GET /workouts/:id/ai-review should NOT mutate plan.aiReview or plan.schedule (unfixed code mutates both)', async () => {
    // Create a workout with a past-due incomplete schedule entry
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const createRes = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'AI Review Workout',
        description: 'Has a past-due entry',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 45,
        exercises: [
          { name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8, restSeconds: 90, notes: '', intensity: 'moderate', order: 1 },
        ],
        schedule: [
          { scheduledDate: pastDate.toISOString(), status: 'scheduled', completed: false },
        ],
      });

    expect(createRes.status).toBe(201);
    const workoutId = createRes.body.workout.id;

    // Snapshot DB state BEFORE the GET
    const planBefore = await WorkoutPlanModel.findById(workoutId).lean();
    const aiReviewBefore = JSON.stringify(planBefore?.aiReview);
    const scheduleBefore = JSON.stringify(planBefore?.schedule);

    // Send GET /workouts/:id/ai-review
    const getRes = await request(app)
      .get(`${WORKOUTS}/${workoutId}/ai-review`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getRes.status).toBe(200);

    // Re-fetch plan from DB AFTER the GET
    const planAfter = await WorkoutPlanModel.findById(workoutId).lean();
    const aiReviewAfter = JSON.stringify(planAfter?.aiReview);
    const scheduleAfter = JSON.stringify(planAfter?.schedule);

    // This assertion FAILS on unfixed code (GET mutates aiReview and sets status: 'missed')
    // Counterexample: GET mutates aiReview and sets schedule entry status to 'missed'
    expect(aiReviewAfter).toBe(aiReviewBefore);
    expect(scheduleAfter).toBe(scheduleBefore);
  });
});

// ------------------------------------------------------------
// Bug 6 — Missing Validation
// EXPLORATION — expected to fail on fixed code
// ------------------------------------------------------------
describe('Bug 6 EXPLORATION — Missing exercise validation (expected to fail on fixed code)', () => {
  const validExercise = {
    name: 'Squat',
    muscleGroup: 'Legs',
    equipment: 'Bodyweight',
    sets: 3,
    reps: 10,
    restSeconds: 60,
    notes: '',
    intensity: 'moderate' as const,
    order: 1,
  };

  it('POST /workouts with sets: 0 should return 400 (unfixed code accepts it with 201)', async () => {
    const res = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Invalid Workout',
        difficulty: 'beginner',
        estimatedDurationMinutes: 30,
        exercises: [{ ...validExercise, sets: 0 }],
      });

    // This assertion FAILS on unfixed code (gets 201 instead of 400)
    // Counterexample: sets: 0 → 201 accepted instead of 400 rejected
    expect(res.status).toBe(400);
  });

  it('POST /workouts with reps: -1 should return 400 (unfixed code accepts it with 201)', async () => {
    const res = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Invalid Workout',
        difficulty: 'beginner',
        estimatedDurationMinutes: 30,
        exercises: [{ ...validExercise, reps: -1 }],
      });

    // This assertion FAILS on unfixed code (gets 201 instead of 400)
    // Counterexample: reps: -1 → 201 accepted instead of 400 rejected
    expect(res.status).toBe(400);
  });

  it('POST /workouts with intensity: "extreme" should return 400 (unfixed code accepts it with 201)', async () => {
    const res = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Invalid Workout',
        difficulty: 'beginner',
        estimatedDurationMinutes: 30,
        exercises: [{ ...validExercise, intensity: 'extreme' }],
      });

    // This assertion FAILS on unfixed code (gets 201 instead of 400)
    // Counterexample: intensity: "extreme" → 201 accepted instead of 400 rejected
    expect(res.status).toBe(400);
  });

  it('POST /workouts with name: "" should return 400 (unfixed code accepts it with 201)', async () => {
    const res = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: '',
        difficulty: 'beginner',
        estimatedDurationMinutes: 30,
        exercises: [{ ...validExercise }],
      });

    // This assertion FAILS on unfixed code (gets 201 instead of 400)
    // Counterexample: name: "" → 201 accepted instead of 400 rejected
    expect(res.status).toBe(400);
  });
});

// ============================================================
// PHASE 2 — PRESERVATION TESTS
// PRESERVATION — must pass on both unfixed and fixed code
// These tests verify that the non-buggy paths work correctly.
// They MUST PASS now (on unfixed code) and MUST continue to
// PASS after fixes are applied.
// ============================================================

// ------------------------------------------------------------
// Bug 3 PRESERVATION — Scheduled completion path
// When a schedule entry exists for today, POST /complete with
// that entry's _id should mark it completed and NOT add extras.
// ------------------------------------------------------------
describe('Bug 3 PRESERVATION — Scheduled completion path (must pass on unfixed and fixed code)', () => {
  it('POST /workouts/:id/complete with a valid scheduleEntryId marks the entry completed and adds no extra entries', async () => {
    // Create a workout with a schedule entry for today (not completed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createRes = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Scheduled Workout',
        description: 'Has a today entry',
        difficulty: 'beginner',
        estimatedDurationMinutes: 30,
        exercises: [
          { name: 'Squat', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 10, restSeconds: 60, notes: '', intensity: 'moderate', order: 1 },
        ],
        schedule: [
          { scheduledDate: today.toISOString(), status: 'scheduled', completed: false },
        ],
      });

    expect(createRes.status).toBe(201);
    const workoutId = createRes.body.workout.id;

    // Fetch the plan from DB to get the real schedule entry _id
    const plan = await WorkoutPlanModel.findById(workoutId);
    expect(plan).not.toBeNull();
    const entry = plan!.schedule[0] as any;
    const entryId = entry._id.toString();
    const initialScheduleLength = plan!.schedule.length;

    // Call POST /complete with the scheduleEntryId
    const completeRes = await request(app)
      .post(`${WORKOUTS}/${workoutId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ scheduleEntryId: entryId });

    // Assert HTTP 200
    expect(completeRes.status).toBe(200);

    // Assert the existing entry is marked completed: true
    const updatedSchedule = completeRes.body.workout.schedule;
    const completedEntry = updatedSchedule.find((e: any) => e._id === entryId || e.id === entryId);
    expect(completedEntry).toBeDefined();
    expect(completedEntry.completed).toBe(true);

    // Assert no extra entries were added (schedule length unchanged)
    expect(updatedSchedule.length).toBe(initialScheduleLength);
  });
});

// ------------------------------------------------------------
// Bug 5 PRESERVATION — GET response shape
// GET /workouts/:id/ai-review should return HTTP 200 with
// { aiReview, missedWorkouts } keys present.
// (POST /ai-review doesn't exist yet on unfixed code — skipped)
// ------------------------------------------------------------
describe('Bug 5 PRESERVATION — GET ai-review response shape (must pass on unfixed and fixed code)', () => {
  it('GET /workouts/:id/ai-review returns HTTP 200 with aiReview and missedWorkouts keys', async () => {
    // Create a workout
    const createRes = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'AI Review Shape Test',
        description: 'Testing response shape',
        difficulty: 'intermediate',
        estimatedDurationMinutes: 45,
        exercises: [
          { name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8, restSeconds: 90, notes: '', intensity: 'moderate', order: 1 },
        ],
      });

    expect(createRes.status).toBe(201);
    const workoutId = createRes.body.workout.id;

    // Send GET /workouts/:id/ai-review
    const getRes = await request(app)
      .get(`${WORKOUTS}/${workoutId}/ai-review`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert HTTP 200
    expect(getRes.status).toBe(200);

    // Assert response body has keys aiReview and missedWorkouts
    expect(getRes.body).toHaveProperty('aiReview');
    expect(getRes.body).toHaveProperty('missedWorkouts');
    expect(Array.isArray(getRes.body.missedWorkouts)).toBe(true);
  });

  // NOTE: POST /workouts/:id/ai-review doesn't exist yet on unfixed code.
  // POST preservation test is pending — will be verified after Bug 5 fix is applied (Task 12.2).
  it.todo('POST /workouts/:id/ai-review preservation — pending (POST route does not exist on unfixed code)');
});

// ------------------------------------------------------------
// Bug 6 PRESERVATION — Valid payload accepted
// POST /workouts with all valid fields should return HTTP 201.
// ------------------------------------------------------------
describe('Bug 6 PRESERVATION — Valid payload accepted (must pass on unfixed and fixed code)', () => {
  it('POST /workouts with all valid fields returns HTTP 201', async () => {
    const res = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test',
        description: 'Valid workout',
        difficulty: 'beginner',
        estimatedDurationMinutes: 30,
        exercises: [
          {
            name: 'Squat',
            muscleGroup: 'Legs',
            equipment: 'Bodyweight',
            sets: 3,
            reps: 10,
            restSeconds: 60,
            notes: '',
            intensity: 'moderate',
            order: 1,
          },
        ],
      });

    // Assert HTTP 201 — valid payloads must always be accepted
    expect(res.status).toBe(201);
    expect(res.body.workout).toHaveProperty('id');
    expect(res.body.workout.name).toBe('Test');
  });
});

// ============================================================
// PHASE 4 — BACKEND TEST SUITE (Bugs 3, 5, 6)
// ============================================================

describe('POST /api/workouts/:id/complete', () => {
  it('creates an ad-hoc completion entry when scheduleEntryId is absent', async () => {
    // Ad-hoc path
    const createRes = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({
      name: 'Ad-hoc', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ name: 'E1', muscleGroup: 'Legs', sets: 1, reps: 1, restSeconds: 0, intensity: 'low', order: 1 }]
    });
    const workoutId = createRes.body.workout.id;

    const res = await request(app).post(`${WORKOUTS}/${workoutId}/complete`).set('Authorization', `Bearer ${accessToken}`).send({});
    expect(res.status).toBe(200);
    const lastEntry = res.body.workout.schedule[res.body.workout.schedule.length - 1];
    expect(lastEntry.completed).toBe(true);
    expect(lastEntry.status).toBe('completed');
    expect(lastEntry.completedAt).not.toBeNull();
  });

  it('preserves existing entry when scheduleEntryId is provided', async () => {
    // Preservation path is already covered in "Bug 3 PRESERVATION" block above, but we can re-test or just add it here per the instructions.
    const createRes = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({
      name: 'Sched', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ name: 'E1', muscleGroup: 'Legs', sets: 1, reps: 1, restSeconds: 0, intensity: 'low', order: 1 }],
      schedule: [{ scheduledDate: new Date().toISOString(), status: 'scheduled', completed: false }]
    });
    const workoutId = createRes.body.workout.id;
    const plan = await WorkoutPlanModel.findById(workoutId);
    const entryId = plan!.schedule[0]._id.toString();

    const res = await request(app).post(`${WORKOUTS}/${workoutId}/complete`).set('Authorization', `Bearer ${accessToken}`).send({ scheduleEntryId: entryId });
    expect(res.status).toBe(200);
    expect(res.body.workout.schedule[0].completed).toBe(true);
    expect(res.body.workout.schedule.length).toBe(1);
  });

  it('returns 404 for invalid scheduleEntryId', async () => {
    const createRes = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({
      name: 'Invalid', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ name: 'E1', muscleGroup: 'Legs', sets: 1, reps: 1, restSeconds: 0, intensity: 'low', order: 1 }]
    });
    const res = await request(app).post(`${WORKOUTS}/${createRes.body.workout.id}/complete`).set('Authorization', `Bearer ${accessToken}`).send({ scheduleEntryId: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/workouts/:id/ai-review (read-only)', () => {
  it('does not mutate db and returns aiReview and missedWorkouts', async () => {
    const createRes = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({
      name: 'AI GET', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ name: 'E1', muscleGroup: 'Legs', sets: 1, reps: 1, restSeconds: 0, intensity: 'low', order: 1 }]
    });
    const workoutId = createRes.body.workout.id;
    const planBefore = await WorkoutPlanModel.findById(workoutId).lean();

    const res = await request(app).get(`${WORKOUTS}/${workoutId}/ai-review`).set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('aiReview');
    expect(res.body).toHaveProperty('missedWorkouts');

    const planAfter = await WorkoutPlanModel.findById(workoutId).lean();
    expect(JSON.stringify(planAfter?.aiReview)).toBe(JSON.stringify(planBefore?.aiReview));
    expect(JSON.stringify(planAfter?.schedule)).toBe(JSON.stringify(planBefore?.schedule));
  });

  it('returns 404 on non-existent plan', async () => {
    const res = await request(app).get(`${WORKOUTS}/${new mongoose.Types.ObjectId()}/ai-review`).set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/workouts/:id/ai-review (refresh)', () => {
  it('triggers mutation of aiReview and sets missed entries', async () => {
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const createRes = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({
      name: 'AI POST', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ name: 'E1', muscleGroup: 'Legs', sets: 1, reps: 1, restSeconds: 0, intensity: 'low', order: 1 }],
      schedule: [{ scheduledDate: pastDate, status: 'scheduled', completed: false }]
    });
    const workoutId = createRes.body.workout.id;

    const res = await request(app).post(`${WORKOUTS}/${workoutId}/ai-review`).set('Authorization', `Bearer ${accessToken}`).send();
    expect(res.status).toBe(200);

    const planAfter = await WorkoutPlanModel.findById(workoutId).lean();
    expect(planAfter?.aiReview).toBeDefined();
    expect(planAfter?.schedule[0].status).toBe('missed');
  });

  it('returns 404 on non-existent plan', async () => {
    const res = await request(app).post(`${WORKOUTS}/${new mongoose.Types.ObjectId()}/ai-review`).set('Authorization', `Bearer ${accessToken}`).send();
    expect(res.status).toBe(404);
  });
});

describe('POST /api/workouts — validation', () => {
  const validExercise = { name: 'E1', muscleGroup: 'Legs', sets: 1, reps: 1, restSeconds: 0, intensity: 'low' as const, order: 1 };
  
  it('rejects invalid sets', async () => {
    const res = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Valid', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ ...validExercise, sets: 0 }] });
    expect(res.status).toBe(400);
  });
  
  it('rejects invalid reps', async () => {
    const res = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Valid', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ ...validExercise, reps: -1 }] });
    expect(res.status).toBe(400);
  });

  it('rejects invalid restSeconds', async () => {
    const res = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Valid', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ ...validExercise, restSeconds: -10 }] });
    expect(res.status).toBe(400);
  });

  it('rejects invalid intensity', async () => {
    const res = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Valid', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ ...validExercise, intensity: 'extreme' }] });
    expect(res.status).toBe(400);
  });

  it('rejects empty name', async () => {
    const res = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: '', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [validExercise] });
    expect(res.status).toBe(400);
  });

  it('rejects invalid difficulty', async () => {
    const res = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Valid', difficulty: 'expert', estimatedDurationMinutes: 30, exercises: [validExercise] });
    expect(res.status).toBe(400);
  });

  it('rejects invalid estimatedDurationMinutes', async () => {
    const res = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Valid', difficulty: 'beginner', estimatedDurationMinutes: 0, exercises: [validExercise] });
    expect(res.status).toBe(400);
  });

  it('accepts valid payload', async () => {
    const res = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Valid', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [validExercise] });
    expect(res.status).toBe(201);
  });
});

describe('PATCH /api/workouts/:id — validation', () => {
  const validExercise = { name: 'E1', muscleGroup: 'Legs', sets: 1, reps: 1, restSeconds: 0, intensity: 'low' as const, order: 1 };

  it('rejects invalid exercise in PATCH', async () => {
    const createRes = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Valid', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [validExercise] });
    const workoutId = createRes.body.workout.id;

    const res = await request(app).patch(`${WORKOUTS}/${workoutId}`).set('Authorization', `Bearer ${accessToken}`).send({ exercises: [{ ...validExercise, sets: 0 }] });
    expect(res.status).toBe(400);
  });

  it('accepts valid PATCH', async () => {
    const createRes = await request(app).post(WORKOUTS).set('Authorization', `Bearer ${accessToken}`).send({ name: 'Valid', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [validExercise] });
    const workoutId = createRes.body.workout.id;

    const res = await request(app).patch(`${WORKOUTS}/${workoutId}`).set('Authorization', `Bearer ${accessToken}`).send({ difficulty: 'advanced' });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/workouts and PATCH /api/workouts/:id — multi-exercise payloads', () => {
  it('creates a workout with multiple exercises in order', async () => {
    const payload = {
      name: 'Multi Exercise Plan',
      description: 'Multiple blocks',
      difficulty: 'intermediate',
      estimatedDurationMinutes: 60,
      exercises: [
        { name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 8, restSeconds: 90, notes: '', intensity: 'moderate', order: 1 },
        { name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8, restSeconds: 90, notes: '', intensity: 'moderate', order: 2 },
        { name: 'Row', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 12, restSeconds: 60, notes: '', intensity: 'moderate', order: 3 },
      ],
    };

    const res = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.workout.exercises).toHaveLength(3);
    expect(res.body.workout.exercises.map((exercise: any) => exercise.name)).toEqual([
      'Squat',
      'Bench Press',
      'Row',
    ]);
    expect(res.body.workout.exercises.map((exercise: any) => exercise.order)).toEqual([1, 2, 3]);
  });

  it('updates a workout with a longer exercise list', async () => {
    const createRes = await request(app)
      .post(WORKOUTS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Patch Plan',
        difficulty: 'beginner',
        estimatedDurationMinutes: 35,
        exercises: [
          { name: 'Push-Up', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 12, restSeconds: 45, notes: '', intensity: 'low', order: 1 },
        ],
      });

    const workoutId = createRes.body.workout.id;
    const updateRes = await request(app)
      .patch(`${WORKOUTS}/${workoutId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        exercises: [
          { name: 'Push-Up', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 12, restSeconds: 45, notes: '', intensity: 'low', order: 1 },
          { name: 'Lunge', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 10, restSeconds: 45, notes: '', intensity: 'low', order: 2 },
        ],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.workout.exercises).toHaveLength(2);
    expect(updateRes.body.workout.exercises.map((exercise: any) => exercise.name)).toEqual(['Push-Up', 'Lunge']);
  });
});
