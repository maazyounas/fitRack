import { AdminDashboard, AdminUser } from '@/types/admin';
import { apiRequest } from './client';

export function fetchAdminDashboard(accessToken: string) {
  return apiRequest<AdminDashboard>('/admin/dashboard', {
    accessToken,
  });
}

export function disableAdminUser(accessToken: string, userId: string) {
  return apiRequest<{ message: string; user: AdminUser }>(`/admin/users/${userId}/disable`, {
    method: 'PATCH',
    accessToken,
  });
}

export function deleteAdminCommunityPost(accessToken: string, postId: string) {
  return apiRequest<{ message: string }>(`/admin/community/posts/${postId}`, {
    method: 'DELETE',
    accessToken,
  });
}

export function deleteAdminCommunityComment(accessToken: string, postId: string, commentId: string) {
  return apiRequest<{ message: string }>(`/admin/community/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    accessToken,
  });
}
