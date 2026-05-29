import mongoose from 'mongoose';

/**
 * Creates all performance-critical indexes.
 * Called once at server startup (after DB connect).
 * Mongo is idempotent — safe to call on every start.
 */
export async function createIndexes() {
  const db = mongoose.connection.db;
  if (!db) {
    console.warn('createIndexes: no DB connection yet');
    return;
  }

  try {
    // ── Users ────────────────────────────────────────────────────────────
    const users = db.collection('users');
    await users.createIndex({ emailHash: 1 }, { unique: true, sparse: true, background: true });
    await users.createIndex({ phoneHash: 1 }, { unique: true, sparse: true, background: true });
    await users.createIndex({ isAdmin: 1, createdAt: -1 }, { background: true });
    await users.createIndex({ lastLoginAt: -1 }, { background: true });
    await users.createIndex({ deactivatedAt: 1 }, { background: true, sparse: true });

    // ── Sessions ─────────────────────────────────────────────────────────
    const sessions = db.collection('sessions');
    await sessions.createIndex({ userId: 1, revokedAt: 1, expiresAt: 1 }, { background: true });
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true }); // TTL

    // ── WorkoutPlans ─────────────────────────────────────────────────────
    const workouts = db.collection('workoutplans');
    await workouts.createIndex({ userId: 1, createdAt: -1 }, { background: true });

    // ── ProgressProfiles ─────────────────────────────────────────────────
    const progress = db.collection('progressprofiles');
    await progress.createIndex({ userId: 1, 'logs.date': -1 }, { background: true });

    // ── NutritionProfiles ────────────────────────────────────────────────
    const nutrition = db.collection('nutritionprofiles');
    // Ensure index is on the current field name (ownerId). Remove legacy userId index if present.
    try {
      const indexes = await nutrition.indexes();
      const hasUserIdIndex = indexes.some((idx: any) => idx.key && idx.key.userId === 1);
      if (hasUserIdIndex) {
        try {
          await nutrition.dropIndex('userId_1');
          console.log('Dropped legacy nutritionprofiles.userId_1 index');
        } catch (err) {
          // ignore drop errors
        }
      }
    } catch (err) {
      // ignore index listing errors
    }
    await nutrition.createIndex({ ownerId: 1 }, { unique: true, background: true });

    // ── SocialPosts ──────────────────────────────────────────────────────
    const posts = db.collection('socialposts');
    await posts.createIndex({ authorId: 1, createdAt: -1 }, { background: true });
    await posts.createIndex({ isReported: 1, createdAt: -1 }, { background: true });
    await posts.createIndex({ challengeId: 1, createdAt: -1 }, { background: true, sparse: true });

    // ── SocialProfiles ───────────────────────────────────────────────────
    const socialProfiles = db.collection('socialprofiles');
    await socialProfiles.createIndex({ ownerId: 1 }, { unique: true, background: true });

    // ── WeeklyChallenges ─────────────────────────────────────────────────
    const challenges = db.collection('weeklychallenges');
    await challenges.createIndex({ startDate: -1, endDate: 1 }, { background: true });

    // ── NotificationTokens ───────────────────────────────────────────────
    const tokens = db.collection('notificationtokens');
    await tokens.createIndex({ userId: 1 }, { background: true });
    await tokens.createIndex({ expoPushToken: 1 }, { unique: true, background: true });

    // ── Exercises ────────────────────────────────────────────────────────
    const exercises = db.collection('exercises');
    await exercises.createIndex({ slug: 1 }, { unique: true, background: true });
    await exercises.createIndex({ muscleGroup: 1, difficulty: 1 }, { background: true });
    await exercises.createIndex({ name: 'text', description: 'text', muscleGroup: 'text', equipment: 'text' }, { background: true }); // text search

    console.log('✅  MongoDB indexes created/verified');
  } catch (error) {
    console.error('❌  Failed to create indexes:', error);
  }
}
