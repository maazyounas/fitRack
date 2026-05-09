import { create } from 'zustand';
import { apiRequest } from '@/services/api/client';
import { useAuthStore } from './authStore';

export type AdminAnalytics = {
  users: {
    total: number;
    active: number;
    disabled: number;
    admins: number;
  };
  content: {
    exercises: number;
    communityPosts: number;
    communityComments: number;
    communityLikes: number;
    activeSessions: number;
    challenges: number;
  };
  retention: {
    newLast7Days: number;
    activeLast7Days: number;
  };
  popularExercises: Array<{ name: string; count: number }>;
};

export type AdminLog = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ipAddress: string;
  timestamp: string;
  userId?: string;
};

export type AdminError = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  timestamp: string;
};

export type AdminDashboardData = {
  analytics: AdminAnalytics;
  users: any[];
  exercises: any[];
  communityPosts: any[];
  system: {
    requestLogs: AdminLog[];
    apiErrors: AdminError[];
  };
};

type AdminState = {
  data: AdminDashboardData | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  sendBroadcast: (title: string, body: string) => Promise<void>;
  createExercise: (payload: any) => Promise<void>;
  updateExercise: (id: string, payload: any) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
};

function getAccessToken() {
  return useAuthStore.getState().tokens?.accessToken;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<AdminDashboardData>('/admin/dashboard', {
        accessToken: getAccessToken(),
      });
      set({ data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  toggleUserStatus: async (userId) => {
    try {
      await apiRequest(`/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        accessToken: getAccessToken(),
      });
      await get().initialize();
    } catch (error) {
      console.error('Toggle status failed', error);
    }
  },

  deletePost: async (postId) => {
    try {
      await apiRequest(`/admin/community/posts/${postId}`, {
        method: 'DELETE',
        accessToken: getAccessToken(),
      });
      await get().initialize();
    } catch (error) {
      console.error('Delete post failed', error);
    }
  },

  sendBroadcast: async (title, body) => {
    try {
      await apiRequest('/admin/notifications/send', {
        method: 'POST',
        accessToken: getAccessToken(),
        body: { title, body },
      });
    } catch (error) {
      console.error('Broadcast failed', error);
      throw error;
    }
  },

  createExercise: async (payload) => {
    try {
      await apiRequest('/admin/exercises', {
        method: 'POST',
        accessToken: getAccessToken(),
        body: payload,
      });
      await get().initialize();
    } catch (error) {
      console.error('Create exercise failed', error);
      throw error;
    }
  },

  updateExercise: async (id, payload) => {
    try {
      await apiRequest(`/admin/exercises/${id}`, {
        method: 'PUT',
        accessToken: getAccessToken(),
        body: payload,
      });
      await get().initialize();
    } catch (error) {
      console.error('Update exercise failed', error);
      throw error;
    }
  },

  deleteExercise: async (id) => {
    try {
      await apiRequest(`/admin/exercises/${id}`, {
        method: 'DELETE',
        accessToken: getAccessToken(),
      });
      await get().initialize();
    } catch (error) {
      console.error('Delete exercise failed', error);
      throw error;
    }
  },
}));
