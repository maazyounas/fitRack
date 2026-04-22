import { ProgressDashboard, ProgressEntry, ProgressPayload } from '@/types/progress';
import { apiRequest } from './client';

export function fetchProgressDashboard(accessToken: string) {
  return apiRequest<ProgressDashboard>('/progress', { accessToken });
}

export async function createProgressEntry(accessToken: string, payload: ProgressPayload) {
  const response = await apiRequest<{ entry: ProgressEntry }>('/progress', {
    method: 'POST',
    accessToken,
    body: payload,
  });

  return response.entry;
}

export async function updateProgressEntry(accessToken: string, entryId: string, payload: ProgressPayload) {
  const response = await apiRequest<{ entry: ProgressEntry }>(`/progress/${entryId}`, {
    method: 'PATCH',
    accessToken,
    body: payload,
  });

  return response.entry;
}
