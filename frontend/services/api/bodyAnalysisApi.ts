/**
 * bodyAnalysisApi.ts — Frontend service for body analysis backend endpoints.
 * Uses the existing apiClient (with auto JWT refresh).
 */

import { apiClient } from './client';
import type { BodyAnalysisResult } from '@/types/bodyAnalysis';

// ─── Save Analysis ────────────────────────────────────────────────────────────

type SaveAnalysisResponse = {
  message: string;
  saved: boolean;
  analysisId?: string;
};

export async function saveBodyAnalysis(result: BodyAnalysisResult): Promise<SaveAnalysisResponse> {
  const response = await apiClient.post<SaveAnalysisResponse>('/body-analysis/save', {
    scanMode: result.mode,
    bodyType: result.bodyType,
    confidence: result.confidence,
    landmarks: result.landmarks,
    bodyMetrics: {},
    workoutSuggestions: result.workoutSuggestions,
    dietSuggestions: result.dietSuggestions,
    postureNotes: result.postureNotes,
    angleFeedback: result.angleFeedback,
    processedLocally: result.processedLocally,
    storageAllowed: result.storageAllowed,
  });
  return response.data;
}

// ─── Fetch History ────────────────────────────────────────────────────────────

type HistoryRecord = {
  _id: string;
  scanMode: 'body' | 'wrist';
  bodyType: string;
  confidence: number;
  createdAt: string;
};

type HistoryResponse = {
  records: HistoryRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export async function fetchBodyAnalysisHistory(
  page = 1,
  limit = 10
): Promise<HistoryResponse> {
  const response = await apiClient.get<HistoryResponse>('/body-analysis/history', {
    params: { page, limit },
  });
  return response.data;
}

// ─── Delete All Data ──────────────────────────────────────────────────────────

type DeleteResponse = {
  message: string;
  deletedCount: number;
};

export async function deleteBodyAnalysisData(): Promise<DeleteResponse> {
  const response = await apiClient.delete<DeleteResponse>('/body-analysis/data');
  return response.data;
}

// ─── Save Onboarding Data ─────────────────────────────────────────────────────

type SaveOnboardingResponse = {
  message: string;
  record: unknown;
};

export async function saveOnboardingToBackend(data: {
  gender: string;
  heightCm: number;
  weightKg: number;
  age: number;
  activityLevel: string;
  experience: string;
  goals: string[];
  wristCm?: number;
}): Promise<SaveOnboardingResponse> {
  const response = await apiClient.post<SaveOnboardingResponse>('/body-analysis/onboarding', data);
  return response.data;
}
