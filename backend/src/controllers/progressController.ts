import { Request, Response } from 'express';
import { ProgressProfileModel } from '../models/ProgressProfile';
import { HttpError } from '../utils/http';

type AuthedRequest = Request & { userId?: string };

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(left: Date, right: Date) {
  return toDayKey(left) === toDayKey(right);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function oneRepMax(weightKg: number, reps: number) {
  if (!weightKg || !reps) {
    return 0;
  }
  return round(weightKg * (1 + reps / 30));
}

async function getOrCreateProfile(userId: string) {
  let profile = await ProgressProfileModel.findOne({ ownerId: userId });
  if (!profile) {
    profile = await ProgressProfileModel.create({ ownerId: userId });
  }
  return profile;
}

function normalizeEntry(entry: any) {
  return {
    id: entry.id,
    loggedAt: entry.loggedAt,
    weightKg: entry.weightKg,
    measurements: {
      chestCm: entry.measurements?.chestCm ?? 0,
      waistCm: entry.measurements?.waistCm ?? 0,
      hipsCm: entry.measurements?.hipsCm ?? 0,
      bicepsCm: entry.measurements?.bicepsCm ?? 0,
      thighCm: entry.measurements?.thighCm ?? 0,
      bodyFatPercent: entry.measurements?.bodyFatPercent ?? 0,
      muscleMassKg: entry.measurements?.muscleMassKg ?? 0,
    },
    gymPerformance: (entry.gymPerformance ?? []).map((item: any) => ({
      id: item.id,
      exerciseName: item.exerciseName,
      weightKg: item.weightKg,
      reps: item.reps,
      sets: item.sets,
      oneRepMaxEstimate: item.oneRepMaxEstimate,
      notes: item.notes,
    })),
    notes: entry.notes,
  };
}

function calculateStreak(entries: any[]) {
  const uniqueDays = [...new Set(entries.map((entry) => toDayKey(new Date(entry.loggedAt))))].sort().reverse();
  let streak = 0;
  const cursor = new Date();

  for (let index = 0; index < uniqueDays.length; index += 1) {
    const expected = new Date(cursor);
    expected.setUTCDate(cursor.getUTCDate() - index);
    if (uniqueDays[index] === toDayKey(expected)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function buildAchievements(entries: any[], streakDays: number) {
  const achievements = [];
  if (entries.length >= 1) {
    achievements.push({
      key: 'first-check-in',
      title: 'First Check-In',
      description: 'Logged your first body or gym progress update.',
      unlockedAt: entries[0].loggedAt,
    });
  }
  if (entries.length >= 7) {
    achievements.push({
      key: 'seven-logs',
      title: 'Consistency Builder',
      description: 'Completed seven progress logs.',
      unlockedAt: entries[6].loggedAt,
    });
  }
  if (streakDays >= 3) {
    achievements.push({
      key: 'three-day-streak',
      title: '3-Day Streak',
      description: 'Tracked progress three days in a row.',
      unlockedAt: new Date(),
    });
  }
  if (entries.some((entry) => (entry.gymPerformance ?? []).some((item: any) => item.oneRepMaxEstimate >= 100))) {
    achievements.push({
      key: 'power-marker',
      title: 'Power Marker',
      description: 'Estimated a 100kg+ one-rep max in at least one logged performance entry.',
      unlockedAt: new Date(),
    });
  }

  return achievements;
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildTrend(entries: any[], days: number) {
  const now = new Date();
  const points = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(now);
    current.setUTCDate(now.getUTCDate() - offset);
    const dayEntries = entries.filter((entry) => isSameDay(new Date(entry.loggedAt), current));
    const latest = dayEntries.at(-1);

    points.push({
      date: toDayKey(current),
      label:
        days > 14
          ? current.toLocaleDateString('en-US', { month: 'short' })
          : current.toLocaleDateString('en-US', { weekday: 'short' }),
      weightKg: latest?.weightKg ?? 0,
      bodyFatPercent: latest?.measurements?.bodyFatPercent ?? 0,
      muscleMassKg: latest?.measurements?.muscleMassKg ?? 0,
      performanceScore: average(
        dayEntries.flatMap((entry) =>
          (entry.gymPerformance ?? []).map((item: any) => Number(item.oneRepMaxEstimate ?? 0))
        )
      ),
    });
  }

  return points;
}

function buildDashboard(profile: any) {
  const entries = [...(profile.entries ?? [])].sort(
    (left, right) => new Date(left.loggedAt).getTime() - new Date(right.loggedAt).getTime()
  );
  const latest = entries.at(-1);
  const previous = entries.length > 1 ? entries.at(-2) : null;
  const streakDays = calculateStreak(entries);
  const achievements = buildAchievements(entries, streakDays);

  profile.streakDays = streakDays;
  profile.achievements = achievements as any;

  return {
    entries: entries.slice().reverse().map(normalizeEntry),
    streakDays,
    achievements,
    summary: {
      currentWeightKg: latest?.weightKg ?? 0,
      weightChangeKg: latest && previous ? round((latest.weightKg ?? 0) - (previous.weightKg ?? 0)) : 0,
      bodyFatTrend: latest?.measurements?.bodyFatPercent ?? 0,
      muscleMassTrend: latest?.measurements?.muscleMassKg ?? 0,
      performanceTrend: average(
        (latest?.gymPerformance ?? []).map((item: any) => Number(item.oneRepMaxEstimate ?? 0))
      ),
    },
    reports: {
      daily: entries.slice(-7).map((entry) => ({
        date: toDayKey(new Date(entry.loggedAt)),
        weightKg: entry.weightKg,
        bodyFatPercent: entry.measurements?.bodyFatPercent ?? 0,
        muscleMassKg: entry.measurements?.muscleMassKg ?? 0,
        performanceScore: average(
          (entry.gymPerformance ?? []).map((item: any) => Number(item.oneRepMaxEstimate ?? 0))
        ),
      })),
      weekly: buildTrend(entries, 7),
      monthly: buildTrend(entries, 30),
    },
  };
}

export async function getProgressDashboard(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);
  const dashboard = buildDashboard(profile);
  await profile.save();
  res.json(dashboard);
}

export async function createProgressEntry(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);
  const payload = req.body as {
    loggedAt?: string;
    weightKg?: number;
    measurements?: Record<string, number>;
    gymPerformance?: Array<{
      exerciseName: string;
      weightKg?: number;
      reps?: number;
      sets?: number;
      notes?: string;
    }>;
    notes?: string;
  };

  const gymPerformance = (payload.gymPerformance ?? []).map((item) => ({
    exerciseName: item.exerciseName,
    weightKg: Number(item.weightKg ?? 0),
    reps: Number(item.reps ?? 0),
    sets: Number(item.sets ?? 0),
    oneRepMaxEstimate: oneRepMax(Number(item.weightKg ?? 0), Number(item.reps ?? 0)),
    notes: item.notes ?? '',
  }));

  profile.entries.push({
    loggedAt: payload.loggedAt ? new Date(payload.loggedAt) : new Date(),
    weightKg: Number(payload.weightKg ?? 0),
    measurements: {
      chestCm: Number(payload.measurements?.chestCm ?? 0),
      waistCm: Number(payload.measurements?.waistCm ?? 0),
      hipsCm: Number(payload.measurements?.hipsCm ?? 0),
      bicepsCm: Number(payload.measurements?.bicepsCm ?? 0),
      thighCm: Number(payload.measurements?.thighCm ?? 0),
      bodyFatPercent: Number(payload.measurements?.bodyFatPercent ?? 0),
      muscleMassKg: Number(payload.measurements?.muscleMassKg ?? 0),
    },
    gymPerformance,
    notes: payload.notes ?? '',
  } as any);

  await profile.save();
  const entry = profile.entries.at(-1);
  res.status(201).json({ entry: normalizeEntry(entry) });
}

export async function updateProgressEntry(req: AuthedRequest, res: Response) {
  const profile = await getOrCreateProfile(req.userId as string);
  const entry = profile.entries.id(String(req.params.id));
  if (!entry) {
    throw new HttpError(404, 'Progress entry not found.');
  }

  if (req.body.loggedAt !== undefined) {
    entry.loggedAt = new Date(req.body.loggedAt);
  }
  if (req.body.weightKg !== undefined) {
    entry.weightKg = Number(req.body.weightKg);
  }
  if (req.body.measurements) {
    entry.measurements = {
      chestCm: Number(req.body.measurements.chestCm ?? 0),
      waistCm: Number(req.body.measurements.waistCm ?? 0),
      hipsCm: Number(req.body.measurements.hipsCm ?? 0),
      bicepsCm: Number(req.body.measurements.bicepsCm ?? 0),
      thighCm: Number(req.body.measurements.thighCm ?? 0),
      bodyFatPercent: Number(req.body.measurements.bodyFatPercent ?? 0),
      muscleMassKg: Number(req.body.measurements.muscleMassKg ?? 0),
    } as any;
  }
  if (Array.isArray(req.body.gymPerformance)) {
    entry.gymPerformance = req.body.gymPerformance.map((item: any) => ({
      exerciseName: item.exerciseName,
      weightKg: Number(item.weightKg ?? 0),
      reps: Number(item.reps ?? 0),
      sets: Number(item.sets ?? 0),
      oneRepMaxEstimate: oneRepMax(Number(item.weightKg ?? 0), Number(item.reps ?? 0)),
      notes: item.notes ?? '',
    })) as any;
  }
  if (req.body.notes !== undefined) {
    entry.notes = req.body.notes;
  }

  await profile.save();
  res.json({ entry: normalizeEntry(entry) });
}
