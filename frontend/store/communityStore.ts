import { create } from 'zustand';
import { apiRequest } from '@/services/api/client';
import { CommunityDashboard, CommunityPost, CommunityChallenge, CommunityMember } from '@/types/community';
import { useAuthStore } from './authStore';

type CommunityState = {
  dashboard: CommunityDashboard | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  createPost: (content: string, imageUrl?: string, challengeId?: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<boolean | null>;
  joinChallenge: (challengeId: string) => Promise<void>;
  reportPost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<CommunityMember[]>;
  getPublicProfile: (userId: string) => Promise<{ profile: CommunityMember; posts: CommunityPost[] }>;
};

function getAccessToken() {
  return useAuthStore.getState().tokens?.accessToken;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  dashboard: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<CommunityDashboard>('/community', {
        accessToken: getAccessToken(),
      });
      set({ dashboard: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  createPost: async (content, imageUrl, challengeId) => {
    try {
      await apiRequest('/community/posts', {
        method: 'POST',
        accessToken: getAccessToken(),
        body: { content, imageUrl, challengeId },
      });
      await get().initialize();
    } catch (error) {
      console.error('Create post failed', error);
      throw error;
    }
  },

  toggleLike: async (postId) => {
    try {
      const { post } = await apiRequest<{ post: CommunityPost }>(`/community/posts/${postId}/like`, {
        method: 'POST',
        accessToken: getAccessToken(),
      });
      
      const dashboard = get().dashboard;
      if (dashboard) {
        set({
          dashboard: {
            ...dashboard,
            posts: dashboard.posts.map((p) => (p.id === postId ? post : p)),
          },
        });
      }
    } catch (error) {
      console.error('Toggle like failed', error);
    }
  },

  addComment: async (postId, content) => {
    try {
      const { post } = await apiRequest<{ post: CommunityPost }>(`/community/posts/${postId}/comments`, {
        method: 'POST',
        accessToken: getAccessToken(),
        body: { content },
      });

      const dashboard = get().dashboard;
      if (dashboard) {
        set({
          dashboard: {
            ...dashboard,
            posts: dashboard.posts.map((p) => (p.id === postId ? post : p)),
          },
        });
      }
    } catch (error) {
      console.error('Add comment failed', error);
      throw error;
    }
  },

  toggleFollow: async (userId) => {
    try {
      const res = await apiRequest<{ message: string; following: boolean; dashboard: CommunityDashboard }>(`/community/follow/${userId}`, {
        method: 'POST',
        accessToken: getAccessToken(),
      });
      // Update dashboard from response to avoid an extra fetch
      set({ dashboard: res.dashboard });
      return res.following;
    } catch (error) {
      console.error('Toggle follow failed', error);
      return null;
    }
  },

  joinChallenge: async (challengeId) => {
    try {
      await apiRequest(`/community/challenges/${challengeId}/join`, {
        method: 'POST',
        accessToken: getAccessToken(),
      });
      await get().initialize();
    } catch (error) {
      console.error('Join challenge failed', error);
    }
  },

  reportPost: async (postId) => {
    try {
      await apiRequest(`/community/posts/${postId}/report`, {
        method: 'POST',
        accessToken: getAccessToken(),
      });
      // Optionally hide post or update state
    } catch (error) {
      console.error('Report post failed', error);
    }
  },

  deletePost: async (postId) => {
    try {
      await apiRequest(`/community/posts/${postId}`, {
        method: 'DELETE',
        accessToken: getAccessToken(),
      });
      await get().initialize();
    } catch (error) {
      console.error('Delete post failed', error);
    }
  },

  searchUsers: async (query) => {
    try {
      const { users } = await apiRequest<{ users: CommunityMember[] }>(`/community/search?q=${query}`, {
        accessToken: getAccessToken(),
      });
      return users;
    } catch (error) {
      console.error('Search users failed', error);
      return [];
    }
  },

  getPublicProfile: async (userId) => {
    try {
      return await apiRequest<{ profile: CommunityMember; posts: CommunityPost[] }>(`/community/profile/${userId}`, {
        accessToken: getAccessToken(),
      });
    } catch (error) {
      console.error('Get public profile failed', error);
      throw error;
    }
  },
}));
