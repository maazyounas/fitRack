export type AnalysisCaptureMode = 'body' | 'wrist';

export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph';

export type LandmarkPoint = {
  id: string;
  label: string;
  x: number;
  y: number;
  confidence: number;
};

export type AnalysisImage = {
  uri: string;
  width: number;
  height: number;
  fileName?: string | null;
  mimeType?: string | null;
};

export type AnalysisInput = {
  mode: AnalysisCaptureMode;
  image: AnalysisImage;
  heightCm?: number;
  weightKg?: number;
  wristCm?: number;
  consentToStore: boolean;
};

export type AnalysisSuggestion = {
  title: string;
  description: string;
};

export type BodyAnalysisResult = {
  mode: AnalysisCaptureMode;
  bodyType: BodyType;
  confidence: number;
  processedLocally: boolean;
  storageAllowed: boolean;
  mediapipeStatus: 'placeholder';
  summary: string;
  landmarks: LandmarkPoint[];
  workoutSuggestions: AnalysisSuggestion[];
  dietSuggestions: AnalysisSuggestion[];
  postureNotes: string[];
  angleFeedback: string[];
};
