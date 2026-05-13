/**
 * bodyAnalysis.ts — Orchestrator service for AI analysis (Placeholder Version).
 * Placeholder implementation without TensorFlow dependencies.
 * Uses mock data instead of real landmark detection.
 */

// Removed TensorFlow dependencies - using placeholder data instead
import { classifyBodyType } from './bodyTypeService';
import { generateRecommendationPlan } from './recommendationService';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import type { 
  AnalysisInput, 
  BodyAnalysisResult, 
  LandmarkPoint 
} from '@/types/bodyAnalysis';

/**
 * Placeholder landmark detection - returns mock data without TensorFlow
 */
function getPlaceholderLandmarks() {
  return {
    landmarks: [
      { id: 'nose', label: 'Nose', x: 0.5, y: 0.2, confidence: 0.95 },
      { id: 'left_shoulder', label: 'Left Shoulder', x: 0.35, y: 0.45, confidence: 0.92 },
      { id: 'right_shoulder', label: 'Right Shoulder', x: 0.65, y: 0.45, confidence: 0.92 },
      { id: 'left_hip', label: 'Left Hip', x: 0.38, y: 0.65, confidence: 0.88 },
      { id: 'right_hip', label: 'Right Hip', x: 0.62, y: 0.65, confidence: 0.88 },
    ],
    ratios: {
      shoulderToWaist: 1.4,
      shoulderToHip: 1.3,
      hipToWaist: 0.9,
      torsoToLeg: 0.52,
    },
    postureData: {
      spineAngleDeg: 5,
      shoulderLevelDeg: 2,
      hipLevelDeg: 3,
      headForwardPosture: false,
    },
    confidence: 0.90,
    detectedPoses: 1,
  };
}

/**
 * Main entry point for performing a body scan analysis.
 * Uses placeholder data instead of TensorFlow.
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
    // 1. Use Placeholder Landmarks & Ratios
    const detection = getPlaceholderLandmarks();

    if (detection.landmarks.length === 0 && input.mode === 'body') {
      throw new Error('No body detected. Please ensure your full body is visible in the frame.');
    }

    // 2. Classify Body Type
    const classification = classifyBodyType({
      heightCm: height,
      weightKg: weight,
      wristCm: input.wristCm || onboarding.metrics?.wristCm,
      shoulderWidthPx: detection.ratios.shoulderToWaist ? 1.5 : undefined, // Placeholder for actual pixel widths if needed
      waistWidthPx: 1,
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
