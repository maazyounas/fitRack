import { CommunityDashboard, CommunityPost, CommunityChallenge } from '@/types/community';
import { apiRequest } from './client';

export function fetchCommunityDashboard(accessToken: string, search = '') {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return apiRequest<CommunityDashboard>(`/community${query}`, {
    accessToken,
  });
}

export function toggleFollow(accessToken: string, userId: string) {
  return apiRequest<{ message: string; following: boolean; dashboard: CommunityDashboard }>(
    `/community/follow/${userId}`,
    {
      method: 'POST',
      accessToken,
    }
  );
}

export function createCommunityPost(accessToken: string, payload: { content: string; challengeId?: string | null }) {
  return apiRequest<{ post: CommunityPost }>('/community/posts', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function toggleCommunityPostLike(accessToken: string, postId: string) {
  return apiRequest<{ message: string; post: CommunityPost }>(`/community/posts/${postId}/like`, {
    method: 'POST',
    accessToken,
  });
}

export function addCommunityPostComment(accessToken: string, postId: string, content: string) {
  return apiRequest<{ message: string; post: CommunityPost }>(`/community/posts/${postId}/comments`, {
    method: 'POST',
    accessToken,
    body: { content },
  });
}

export function joinWeeklyChallenge(accessToken: string, challengeId: string) {
  return apiRequest<{ message: string; challenge: CommunityChallenge }>(`/community/challenges/${challengeId}/join`, {
    method: 'POST',
    accessToken,
  });
}

export function addWeeklyChallengeProgress(accessToken: string, challengeId: string, scoreDelta = 1) {
  return apiRequest<{ message: string; challenge: CommunityChallenge; myScore: number }>(
    `/community/challenges/${challengeId}/progress`,
    {
      method: 'POST',
      accessToken,
      body: { scoreDelta },
    }
  );
}
