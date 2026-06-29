import { apiRequest } from './client';
import type { NotificationInboxResponse, NotificationInboxItem } from '@/types/notifications';

export function fetchUserNotifications(accessToken: string, params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));

  const query = search.toString();
  return apiRequest<NotificationInboxResponse>(`/users/notifications${query ? `?${query}` : ''}`, {
    accessToken,
  });
}

export function markNotificationAsRead(accessToken: string, notificationId: string) {
  return apiRequest<{ message: string; notification: NotificationInboxItem }>(`/users/notifications/${notificationId}/read`, {
    method: 'PATCH',
    accessToken,
  });
}

export function markAllNotificationsAsRead(accessToken: string) {
  return apiRequest<{ message: string; modifiedCount: number }>('/users/notifications/read-all', {
    method: 'PATCH',
    accessToken,
  });
}

export function clearUserNotifications(accessToken: string) {
  return apiRequest<{ message: string; deletedCount: number }>('/users/notifications', {
    method: 'DELETE',
    accessToken,
  });
}

export function savePushToken(accessToken: string, token: string, deviceType: string = 'unknown') {
  return apiRequest<{ message: string }>('/users/notifications/push-token', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({ token, deviceType }),
  });
}