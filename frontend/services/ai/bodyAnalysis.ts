/**
 * bodyAnalysis.ts — Orchestrator service for AI analysis.
 * Runs pose detection first, then body type classification and recommendation generation.
 */

import { classifyBodyType } from './bodyTypeService';
import { generateRecommendationPlan } from './recommendationService';
import { detectLandmarks } from './landmarkDetectionService';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import type { 
  AnalysisInput, 
  BodyAnalysisResult, 
  LandmarkPoint 
} from '@/types/bodyAnalysis';

/**
 * Main entry point for performing a body scan analysis.
 * Uses real pose detection and falls back to a clear no-body message when no human is detected.
 */
export async function runBodyAnalysis(input: AnalysisInput): Promise<BodyAnalysisResult> {
  const onboarding = useOnboardingStore.getState();
  const auth = useAuthStore.getState();
  
  const gender = onboarding.gender || (auth.user?.profile.gender === 'female' ? 'female' : 'male');
  const height = input.heightCm || onboarding.metrics?.heightCm || auth.user?.profile.heightCm || 170;
  const weight = input.weightKg || onboarding.metrics?.weightKg || auth.user?.profile.weightKg || 70;
  const age = onboarding.metrics?.age || auth.user?.profile.age || 25;
  const activityLevel = onboarding.metrics?.activityLevel || 'moderate';
  const experience = onboarding.metrics?.experience || 'beginner';
  const goals = onboarding.goals || [];

  try {
    // 1. Run real pose detection on the captured image.
    const detection = await detectLandmarks(input.image.uri, input.image.width, input.image.height);

    if (detection.detectedPoses === 0 || detection.landmarks.length === 0 || detection.confidence < 0.15) {
      throw new Error('No body detected. Please use a clear photo with a full human body visible in the frame.');
    }

    // 2. Classify Body Type
    const classification = classifyBodyType({
      heightCm: height,
      weightKg: weight,
      wristCm: input.wristCm || onboarding.metrics?.wristCm,
      shoulderWidthPx: detection.ratios.shoulderToWaist ?? detection.ratios.shoulderToHip,
      waistWidthPx: detection.ratios.shoulderToWaist || detection.ratios.shoulderToHip ? 1 : undefined,
    });

    // 3. Generate Recommendations
    const plan = generateRecommendationPlan({
      bodyType: classification.bodyType,
      goals,
      activityLevel,
      experience,
      gender,
      heightCm: height,
      weightKg: weight,
      age,
    });

    // 4. Transform to Result Type
    const landmarks: LandmarkPoint[] = detection.landmarks.map(l => ({
      id: l.id,
      label: l.label,
      x: l.x,
      y: l.y,
      confidence: l.confidence,
    }));

    const result: BodyAnalysisResult = {
      mode: input.mode,
      bodyType: classification.bodyType,
      confidence: (classification.confidence + detection.confidence) / 2,
      processedLocally: true,
      storageAllowed: input.consentToStore,
      mediapipeStatus: 'active',
      summary: classification.insights[0] || `Analysis complete. Detected ${classification.bodyType} body type.`,
      landmarks,
      workoutSuggestions: plan.workoutSplit.map(s => ({
        title: s.focus,
        description: s.exercises.join(', '),
      })),
      dietSuggestions: plan.diet.notes.map(n => ({
        title: 'Dietary Focus',
        description: n,
      })),
      postureNotes: [
        `Spine angle: ${detection.postureData.spineAngleDeg.toFixed(1)}°`,
        detection.postureData.headForwardPosture ? 'Slight head forward posture detected.' : 'Good head alignment.',
      ],
      angleFeedback: [
        `Shoulder level: ${detection.postureData.shoulderLevelDeg.toFixed(1)}°`,
        `Hip level: ${detection.postureData.hipLevelDeg.toFixed(1)}°`,
      ],
    };

    return result;
  } catch (error) {
    console.error('[runBodyAnalysis] Error:', error);
    throw error instanceof Error ? error : new Error('Analysis failed. Please try again.');
  }
}
