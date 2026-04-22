import { AnalysisInput, AnalysisSuggestion, BodyAnalysisResult, BodyType, LandmarkPoint } from '@/types/bodyAnalysis';

function createLandmarks(mode: AnalysisInput['mode']): LandmarkPoint[] {
  if (mode === 'wrist') {
    return [
      { id: 'wrist-top', label: 'Wrist Top', x: 0.48, y: 0.35, confidence: 0.88 },
      { id: 'wrist-bottom', label: 'Wrist Bottom', x: 0.52, y: 0.62, confidence: 0.86 },
      { id: 'thumb-base', label: 'Thumb Base', x: 0.38, y: 0.48, confidence: 0.79 },
      { id: 'pinky-base', label: 'Pinky Base', x: 0.62, y: 0.5, confidence: 0.8 },
    ];
  }

  return [
    { id: 'left-shoulder', label: 'Left Shoulder', x: 0.34, y: 0.22, confidence: 0.9 },
    { id: 'right-shoulder', label: 'Right Shoulder', x: 0.66, y: 0.22, confidence: 0.91 },
    { id: 'left-hip', label: 'Left Hip', x: 0.41, y: 0.52, confidence: 0.86 },
    { id: 'right-hip', label: 'Right Hip', x: 0.59, y: 0.52, confidence: 0.87 },
    { id: 'left-knee', label: 'Left Knee', x: 0.43, y: 0.76, confidence: 0.78 },
    { id: 'right-knee', label: 'Right Knee', x: 0.57, y: 0.76, confidence: 0.79 },
  ];
}

function classifyBodyType(input: AnalysisInput): { bodyType: BodyType; confidence: number } {
  const bmi =
    input.heightCm && input.weightKg ? input.weightKg / Math.pow(input.heightCm / 100, 2) : undefined;

  if (input.mode === 'wrist' && input.wristCm) {
    if (input.wristCm < 16.5) {
      return { bodyType: 'ectomorph', confidence: 0.72 };
    }
    if (input.wristCm > 18.5) {
      return { bodyType: 'endomorph', confidence: 0.7 };
    }
    return { bodyType: 'mesomorph', confidence: 0.74 };
  }

  if (bmi !== undefined) {
    if (bmi < 20.5) {
      return { bodyType: 'ectomorph', confidence: 0.71 };
    }
    if (bmi > 27) {
      return { bodyType: 'endomorph', confidence: 0.73 };
    }
  }

  return { bodyType: 'mesomorph', confidence: 0.76 };
}

function workoutSuggestions(bodyType: BodyType): AnalysisSuggestion[] {
  switch (bodyType) {
    case 'ectomorph':
      return [
        {
          title: 'Bias training toward strength progressions',
          description: 'Use compound lifts, longer rest, and steady load increases three to four days each week.',
        },
        {
          title: 'Keep cardio short and intentional',
          description: 'Choose low-volume cardio so recovery stays available for muscle gain.',
        },
      ];
    case 'endomorph':
      return [
        {
          title: 'Use full-body circuits plus resistance work',
          description: 'Blend strength training with short conditioning blocks to support calorie burn and muscle retention.',
        },
        {
          title: 'Increase weekly movement volume',
          description: 'Add walking, bike sessions, or incline treadmill work between lifting days.',
        },
      ];
    default:
      return [
        {
          title: 'Build around balanced hypertrophy',
          description: 'Alternate heavy compound sessions with moderate accessory volume for all major muscle groups.',
        },
        {
          title: 'Use performance blocks',
          description: 'Cycle strength, athletic conditioning, and recovery weeks to keep progress balanced.',
        },
      ];
  }
}

function dietSuggestions(bodyType: BodyType): AnalysisSuggestion[] {
  switch (bodyType) {
    case 'ectomorph':
      return [
        {
          title: 'Eat a modest calorie surplus',
          description: 'Prioritize protein at each meal, dense carbs around training, and consistent meal timing.',
        },
        {
          title: 'Use easy-to-finish meals',
          description: 'Smoothies, yogurt bowls, rice dishes, and nut butters make it easier to reach intake targets.',
        },
      ];
    case 'endomorph':
      return [
        {
          title: 'Anchor meals with protein and fiber',
          description: 'Start with lean protein, vegetables, legumes, and hydration before energy-dense extras.',
        },
        {
          title: 'Keep carbs deliberate',
          description: 'Focus higher-carb meals around workouts and favor minimally processed sources.',
        },
      ];
    default:
      return [
        {
          title: 'Aim for balanced plates',
          description: 'Match each meal with lean protein, smart carbs, colorful produce, and healthy fats.',
        },
        {
          title: 'Adjust intake with training demand',
          description: 'Slightly increase carbs on harder training days and pull back on easier recovery days.',
        },
      ];
  }
}

export async function runBodyAnalysisPlaceholder(input: AnalysisInput): Promise<BodyAnalysisResult> {
  const classification = classifyBodyType(input);
  const landmarks = createLandmarks(input.mode);
  const angleFeedback =
    input.mode === 'wrist'
      ? [
          'Keep the wrist centered with the camera parallel to the forearm.',
          'Avoid clenched fists or tilted angles so wrist width stays readable.',
        ]
      : [
          'Stand square to the camera with the full body visible from head to ankles.',
          'Use even lighting and keep shoulders level for better landmark placement.',
        ];

  const postureNotes =
    input.mode === 'wrist'
      ? ['Neutral wrist position detected in placeholder mode.', 'Retake if fingers block the wrist joint.']
      : ['Placeholder landmarks suggest a front-facing stance.', 'Retake if hips or shoulders are cropped.'];

  return {
    mode: input.mode,
    bodyType: classification.bodyType,
    confidence: classification.confidence,
    processedLocally: true,
    storageAllowed: input.consentToStore,
    mediapipeStatus: 'placeholder',
    summary:
      'This is a local placeholder for future MediaPipe landmark detection. No image was uploaded or stored remotely.',
    landmarks,
    workoutSuggestions: workoutSuggestions(classification.bodyType),
    dietSuggestions: dietSuggestions(classification.bodyType),
    postureNotes,
    angleFeedback,
  };
}
