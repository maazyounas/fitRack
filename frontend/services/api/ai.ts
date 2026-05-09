import { AiCoachChatResponse, AiCoachDataPoints, AiCoachSummary } from '@/types/ai';
import { apiRequest } from './client';

export function fetchAiCoachSummary(accessToken: string) {
  return apiRequest<{
    summary: AiCoachSummary;
    recovery: AiCoachSummary['recovery'];
    stress: AiCoachSummary['stress'];
    dataPoints: AiCoachDataPoints;
  }>('/ai/coach', { accessToken });
}

export async function sendAiCoachMessage(accessToken: string, message: string) {
  const response = await apiRequest<{ response: AiCoachChatResponse }>('/ai/coach/chat', {
    method: 'POST',
    accessToken,
    body: { message },
  });

  return response.response;
}

export function fetchWorkoutRecommendations(accessToken: string) {
  return apiRequest<{ recommendation: any }>('/ai/recommendations/workout', { accessToken });
}

export function fetchWeeklyInsights(accessToken: string) {
  return apiRequest<{ insights: any[] }>('/ai/insights/weekly', { accessToken });
}
