import { Request, Response } from 'express';
import { BodyAnalysis } from '../models/BodyAnalysis';
import { OnboardingData } from '../models/OnboardingData';
import mongoose from 'mongoose';

// Extend Request to include userId set by requireAuth middleware
type AuthRequest = Request & { userId?: string };

function serializeOnboardingData(record: any) {
  if (!record) return null;

  return {
    id: String(record._id ?? record.id ?? ''),
    userId: String(record.userId),
    gender: record.gender,
    heightCm: record.heightCm,
    weightKg: record.weightKg,
    age: record.age,
    activityLevel: record.activityLevel,
    experience: record.experience,
    goals: record.goals ?? [],
    wristCm: record.wristCm,
    completedAt: record.completedAt,
  };
}

/**
 * POST /api/body-analysis/save
 * Save an analysis result to the user's scan history.
 */
export async function saveBodyAnalysis(req: Request, res: Response): Promise<void> {
  try {
  const userId = (req as AuthRequest).userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const {
      scanMode,
      bodyType,
      confidence,
      landmarks,
      bodyMetrics,
      workoutSuggestions,
      dietSuggestions,
      postureNotes,
      angleFeedback,
      processedLocally,
      storageAllowed,
    } = req.body;

    if (!storageAllowed) {
      res.status(200).json({ message: 'Storage not consented — nothing saved.', saved: false });
      return;
    }

    const analysis = await BodyAnalysis.create({
      userId: new mongoose.Types.ObjectId(userId),
      scanMode,
      bodyType,
      confidence,
      landmarks: landmarks ?? [],
      bodyMetrics: bodyMetrics ?? {},
      workoutSuggestions: workoutSuggestions ?? [],
      dietSuggestions: dietSuggestions ?? [],
      postureNotes: postureNotes ?? [],
      angleFeedback: angleFeedback ?? [],
      processedLocally: processedLocally ?? true,
      storageAllowed: true,
    });

    res.status(201).json({ message: 'Analysis saved.', saved: true, analysisId: analysis._id });
  } catch (error) {
    console.error('[BodyAnalysis] Save error:', error);
    res.status(500).json({ message: 'Failed to save analysis.' });
  }
}

/**
 * GET /api/body-analysis/history
 * Fetch paginated scan history for the current user.
 */
export async function getBodyAnalysisHistory(req: Request, res: Response): Promise<void> {
  try {
  const userId = (req as AuthRequest).userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      BodyAnalysis.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-landmarks -__v') // Exclude heavy landmark data from list view
        .lean(),
      BodyAnalysis.countDocuments({ userId }),
    ]);

    res.json({
      records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[BodyAnalysis] History error:', error);
    res.status(500).json({ message: 'Failed to load history.' });
  }
}

/**
 * DELETE /api/body-analysis/data
 * Delete all scan records for the current user (privacy right to erasure).
 */
export async function deleteBodyAnalysisData(req: Request, res: Response): Promise<void> {
  try {
  const userId = (req as AuthRequest).userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const result = await BodyAnalysis.deleteMany({ userId });
    res.json({ message: `${result.deletedCount} scan record(s) deleted.`, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('[BodyAnalysis] Delete error:', error);
    res.status(500).json({ message: 'Failed to delete analysis data.' });
  }
}

/**
 * POST /api/body-analysis/onboarding
 * Upsert onboarding data for a user.
 */
export async function saveOnboardingData(req: Request, res: Response): Promise<void> {
  try {
  const userId = (req as AuthRequest).userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { gender, heightCm, weightKg, age, activityLevel, experience, goals, wristCm } = req.body;

    const record = await OnboardingData.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          gender,
          heightCm,
          weightKg,
          age,
          activityLevel,
          experience,
          goals,
          wristCm,
          completedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'Onboarding data saved.', record });
  } catch (error) {
    console.error('[BodyAnalysis] Onboarding save error:', error);
    res.status(500).json({ message: 'Failed to save onboarding data.' });
  }
}

/**
 * GET /api/body-analysis/onboarding
 * Fetch the onboarding snapshot for the current user.
 */
export async function getOnboardingData(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const record = await OnboardingData.findOne({ userId }).lean();
    res.status(200).json({
      message: record ? 'Onboarding data loaded.' : 'No onboarding data found.',
      record: serializeOnboardingData(record),
    });
  } catch (error) {
    console.error('[BodyAnalysis] Onboarding load error:', error);
    res.status(500).json({ message: 'Failed to load onboarding data.' });
  }
}
