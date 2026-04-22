import { create } from 'zustand';
import {
  deleteStoredImages,
  deactivateUser,
  deleteUser,
  fetchImageConsent,
  fetchCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  revokeImageConsent,
  registerUser,
  updateImageConsent,
  updateUserPreferences,
  updateUserProfile,
  verifyRegistrationOtp,
} from '@/services/api/auth';
import { SESSION_TIMEOUT_MS } from '@/constants/config';
import { getSecureItem, removeSecureItem, setSecureItem } from '@/services/storage/secureStore';
import {
  AuthTokens,
  ImageConsent,
  RegisterPayload,
  UpdatePreferencesPayload,
  UpdateProfilePayload,
  User,
} from '@/types/user';
import { useUiStore } from './uiStore';

const sessionStorageKey = 'session';

type AuthState = {
  user: User | null;
  tokens: AuthTokens | null;
  imageConsent: ImageConsent | null;
  isLoading: boolean;
  isHydrated: boolean;
  lastActivityAt: number;
  initialize: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ message: string; user: User }>;
  verifyOtp: (payload: {
    identifier: string;
    otp: string;
    purpose: 'verify-email' | 'verify-phone';
  }) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  touchActivity: () => void;
  refreshAccessToken: () => Promise<void>;
  checkInactivity: () => Promise<boolean>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updatePreferences: (payload: UpdatePreferencesPayload) => Promise<void>;
  deactivateAccount: () => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
  loadImageConsent: () => Promise<void>;
  saveImageConsent: (
    payload: Partial<
      Pick<ImageConsent, 'consentGiven' | 'usageExplanationAccepted' | 'processingMode' | 'storageAllowed'>
    >
  ) => Promise<void>;
  revokeImageConsent: () => Promise<void>;
  deleteStoredImages: () => Promise<void>;
};

async function persistSession(session: { user: User; tokens: AuthTokens } | null) {
  if (!session) {
    await removeSecureItem(sessionStorageKey);
    return;
  }

  await setSecureItem(sessionStorageKey, session);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  imageConsent: null,
  isLoading: false,
  isHydrated: false,
  lastActivityAt: Date.now(),
  initialize: async () => {
    try {
      const storedSession = await getSecureItem<{ user: User; tokens: AuthTokens }>(sessionStorageKey);
      if (!storedSession) {
        set({ isHydrated: true });
        return;
      }

      set({
        user: storedSession.user,
        tokens: storedSession.tokens,
        lastActivityAt: Date.now(),
      });

      useUiStore.getState().setPreferences(storedSession.user.preferences);

      try {
        const { user } = await fetchCurrentUser(storedSession.tokens.accessToken);
        let imageConsent: ImageConsent | null = null;
        try {
          const response = await fetchImageConsent(storedSession.tokens.accessToken);
          imageConsent = response.consent;
        } catch {
          imageConsent = null;
        }

        useUiStore.getState().setPreferences(user.preferences);
        set({ user, imageConsent, isHydrated: true });
        await persistSession({ user, tokens: storedSession.tokens });
      } catch {
        await get().refreshAccessToken();
        const nextTokens = get().tokens;
        if (!nextTokens) {
          throw new Error('Session unavailable.');
        }

        const { user } = await fetchCurrentUser(nextTokens.accessToken);
        let imageConsent: ImageConsent | null = null;
        try {
          const response = await fetchImageConsent(nextTokens.accessToken);
          imageConsent = response.consent;
        } catch {
          imageConsent = null;
        }

        useUiStore.getState().setPreferences(user.preferences);
        set({ user, imageConsent, isHydrated: true });
        await persistSession({ user, tokens: nextTokens });
      }
    } catch {
      await persistSession(null);
      set({ user: null, tokens: null, imageConsent: null, isHydrated: true });
    }
  },
  register: async (payload) => {
    set({ isLoading: true });
    try {
      return await registerUser(payload);
    } finally {
      set({ isLoading: false });
    }
  },
  verifyOtp: async (payload) => {
    set({ isLoading: true });
    try {
      await verifyRegistrationOtp(payload);
    } finally {
      set({ isLoading: false });
    }
  },
  login: async (identifier, password) => {
    set({ isLoading: true });
    try {
      const response = await loginUser({ identifier, password });
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        sessionSecret: response.sessionSecret,
      };

      await persistSession({ user: response.user, tokens });
      useUiStore.getState().setPreferences(response.user.preferences);
      set({
        user: response.user,
        tokens,
        lastActivityAt: Date.now(),
      });
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    const tokens = get().tokens;
    if (tokens?.refreshToken) {
      try {
        await logoutUser(tokens.refreshToken);
      } catch {
        // Clear the local session even if the network request fails.
      }
    }

    await persistSession(null);
    useUiStore.getState().reset();
      set({
      user: null,
      tokens: null,
      imageConsent: null,
      isLoading: false,
      lastActivityAt: Date.now(),
    });
  },
  touchActivity: () => set({ lastActivityAt: Date.now() }),
  refreshAccessToken: async () => {
    const tokens = get().tokens;
    if (!tokens) {
      return;
    }

    const refreshed = await refreshSession({
      refreshToken: tokens.refreshToken,
      sessionSecret: tokens.sessionSecret,
    });

    const updatedTokens = {
      ...tokens,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    };

    set({ tokens: updatedTokens });
    if (get().user) {
      await persistSession({ user: get().user as User, tokens: updatedTokens });
    }
  },
  checkInactivity: async () => {
    if (!get().tokens) {
      return false;
    }

    if (Date.now() - get().lastActivityAt < SESSION_TIMEOUT_MS) {
      return false;
    }

    await get().logout();
    return true;
  },
  updateProfile: async (payload) => {
    const tokens = get().tokens;
    if (!tokens) {
      throw new Error('You need to log in first.');
    }

    set({ isLoading: true });
    try {
      const response = await updateUserProfile(tokens.accessToken, payload);
      await persistSession({ user: response.user, tokens });
      set({ user: response.user, lastActivityAt: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },
  updatePreferences: async (payload) => {
    const tokens = get().tokens;
    if (!tokens) {
      throw new Error('You need to log in first.');
    }

    set({ isLoading: true });
    try {
      const response = await updateUserPreferences(tokens.accessToken, payload);
      await persistSession({ user: response.user, tokens });
      useUiStore.getState().setPreferences(response.user.preferences);
      set({ user: response.user, lastActivityAt: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },
  deactivateAccount: async () => {
    const tokens = get().tokens;
    if (!tokens) {
      throw new Error('You need to log in first.');
    }

    await deactivateUser(tokens.accessToken);
    await get().logout();
  },
  deleteAccount: async (confirmation) => {
    const tokens = get().tokens;
    if (!tokens) {
      throw new Error('You need to log in first.');
    }

    await deleteUser(tokens.accessToken, confirmation);
    await get().logout();
  },
  loadImageConsent: async () => {
    const tokens = get().tokens;
    if (!tokens) {
      throw new Error('You need to log in first.');
    }

    const response = await fetchImageConsent(tokens.accessToken);
    set({ imageConsent: response.consent });
  },
  saveImageConsent: async (payload) => {
    const tokens = get().tokens;
    if (!tokens) {
      throw new Error('You need to log in first.');
    }

    set({ isLoading: true });
    try {
      const response = await updateImageConsent(tokens.accessToken, payload);
      set({ imageConsent: response.consent });
    } finally {
      set({ isLoading: false });
    }
  },
  revokeImageConsent: async () => {
    const tokens = get().tokens;
    if (!tokens) {
      throw new Error('You need to log in first.');
    }

    set({ isLoading: true });
    try {
      const response = await revokeImageConsent(tokens.accessToken);
      set({ imageConsent: response.consent });
    } finally {
      set({ isLoading: false });
    }
  },
  deleteStoredImages: async () => {
    const tokens = get().tokens;
    if (!tokens) {
      throw new Error('You need to log in first.');
    }

    set({ isLoading: true });
    try {
      const response = await deleteStoredImages(tokens.accessToken);
      set({ imageConsent: response.consent });
    } finally {
      set({ isLoading: false });
    }
  },
}));
