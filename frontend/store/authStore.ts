import { Platform } from 'react-native';
import { create } from 'zustand';
import {
  deleteStoredImages,
  deactivateUser,
  deleteUser,
  fetchOnboardingFromBackend,
  fetchImageConsent,
  fetchCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  revokeImageConsent,
  registerUser,
  resendOtp as resendOtpApi,
  updateImageConsent,
  updateUserPreferences,
  updateUserProfile,
  uploadProfilePicture as uploadProfilePictureApi,
  updateFitnessGoals as updateFitnessGoalsApi,
  saveOnboardingProfile as saveOnboardingProfileApi,
  verifyRegistrationOtp,
} from '@/services/api/auth';
import { SESSION_TIMEOUT_MS, SESSION_WARNING_MS } from '@/constants/config';
import { API_BASE_URL } from '@/constants/config';
import { getSecureItem, removeSecureItem, setSecureItem } from '@/services/storage/secureStore';
import {
  AuthTokens,
  ImageConsent,
  OnboardingSnapshot,
  RegisterPayload,
  UpdatePreferencesPayload,
  UpdateProfilePayload,
  User,
  FitnessGoals,
} from '@/types/user';
import { useUiStore } from './uiStore';
import { useOnboardingStore } from './onboardingStore';

const sessionStorageKey = 'session';
const rememberMeKey = 'rememberMe';

type AuthState = {
  user: User | null;
  tokens: AuthTokens | null;
  imageConsent: ImageConsent | null;
  onboardingSnapshot: OnboardingSnapshot | null;
  isLoading: boolean;
  isHydrated: boolean;
  lastActivityAt: number;
  rememberMe: boolean;
  /** True when the session is <SESSION_WARNING_MS away from expiring */
  sessionWarning: boolean;
  initialize: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ message: string; debugOtp?: { email?: string; phone?: string } }>;
  verifyOtp: (payload: {
    identifier: string;
    otp: string;
    purpose: 'verify-email' | 'verify-phone';
  }) => Promise<void>;
  resendOtp: (payload: { identifier: string; purpose: 'verify-email' | 'verify-phone' }) => Promise<void>;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  touchActivity: () => void;
  refreshAccessToken: () => Promise<void>;
  refreshOnboardingSnapshot: () => Promise<void>;
  /** Returns true if the session was expired and the user was logged out */
  checkInactivity: () => Promise<boolean>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updatePreferences: (payload: UpdatePreferencesPayload) => Promise<void>;
  updateFitnessGoals: (payload: Partial<FitnessGoals>) => Promise<void>;
  saveOnboardingProfile: (payload: {
    gender?: 'male' | 'female' | 'other';
    heightCm?: number;
    weightKg?: number;
    age?: number;
    primaryGoal?: FitnessGoals['primaryGoal'];
    targetWeightKg?: number;
    workoutFrequencyPerWeek?: number;
    wristCm?: number;
    bodyType?: 'ectomorph' | 'mesomorph' | 'endomorph' | 'balanced';
    onboardingCompleted?: boolean;
  }) => Promise<void>;
  uploadProfilePicture: (imageUri: string) => Promise<void>;
  uploadProgress: number | null;
  setUploadProgress: (p: number | null) => void;
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
  setRememberMe: (value: boolean) => Promise<void>;
  dismissSessionWarning: () => void;
};

async function persistSession(session: { user: User; tokens: AuthTokens } | null) {
  if (!session) {
    await removeSecureItem(sessionStorageKey);
    return;
  }
  await setSecureItem(sessionStorageKey, session);
}

function deriveOnboardingCompleted(user: User | null, snapshot: OnboardingSnapshot | null) {
  if (!user) return false;
  return Boolean(user.onboardingCompleted || user.fitnessGoals?.setupCompleted || snapshot);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  imageConsent: null,
  onboardingSnapshot: null,
  isLoading: false,
  isHydrated: false,
  lastActivityAt: Date.now(),
  rememberMe: true,
  sessionWarning: false,
  uploadProgress: null,

  initialize: async () => {
    try {
      const storedRememberMe = await getSecureItem<boolean>(rememberMeKey);
      const remembering = storedRememberMe !== false; // default true

      const storedSession = await getSecureItem<{ user: User; tokens: AuthTokens }>(sessionStorageKey);
      if (!storedSession) {
        set({ isHydrated: true, rememberMe: remembering });
        return;
      }

      set({
        user: storedSession.user,
        tokens: storedSession.tokens,
        lastActivityAt: Date.now(),
        rememberMe: remembering,
      });

      useUiStore.getState().setPreferences(storedSession.user.preferences);

      // Helper: detect whether an error is a network/connectivity issue
      // vs a genuine auth rejection (401/403). Network errors should not
      // clear the session — the backend may just be restarting.
      const isNetworkError = (error: unknown): boolean => {
        if (!error) return false;
        const msg = error instanceof Error ? error.message : String(error);
        // Axios network errors, fetch failures, timeouts
        if (msg.includes('Network Error') || msg.includes('ECONNREFUSED') ||
            msg.includes('ENOTFOUND') || msg.includes('timeout') ||
            msg.includes('API_BASE_URL=')) {
          return true;
        }
        // If there's no HTTP status code it's likely a connectivity issue
        const status = (error as any)?.response?.status;
        if (!status) return true;
        return false;
      };

      const isAuthError = (error: unknown): boolean => {
        const status = (error as any)?.response?.status;
        return status === 401 || status === 403;
      };

      try {
        const { user } = await fetchCurrentUser(storedSession.tokens.accessToken);
        let imageConsent: ImageConsent | null = null;
        let onboardingSnapshot: OnboardingSnapshot | null = null;
        try {
          const response = await fetchImageConsent(storedSession.tokens.accessToken);
          imageConsent = response.consent;
        } catch {
          imageConsent = null;
        }
        try {
          const response = await fetchOnboardingFromBackend(storedSession.tokens.accessToken);
          onboardingSnapshot = response.record;
        } catch {
          onboardingSnapshot = null;
        }

        useUiStore.getState().setPreferences(user.preferences);
        useOnboardingStore.getState().setOnboardingCompleted(deriveOnboardingCompleted(user, onboardingSnapshot));
        set({ user, imageConsent, onboardingSnapshot, isHydrated: true });
        await persistSession({ user, tokens: storedSession.tokens });
      } catch (fetchErr) {
        // If this is a network error (backend restarting/down), keep the
        // stored session so the user stays logged in. They can use the app
        // once the backend is back.
        if (isNetworkError(fetchErr) && !isAuthError(fetchErr)) {
          console.warn('[Auth] Backend unavailable during init — keeping cached session.');
          set({ isHydrated: true });
          return;
        }

        // Access token expired or rejected — try to refresh
        try {
          await get().refreshAccessToken();
        } catch (refreshErr) {
          // If refresh also fails due to network, keep the cached session
          if (isNetworkError(refreshErr) && !isAuthError(refreshErr)) {
            console.warn('[Auth] Backend unavailable during token refresh — keeping cached session.');
            set({ isHydrated: true });
            return;
          }
          // True auth failure (invalid/expired refresh token) — clear session
          throw refreshErr;
        }

        const nextTokens = get().tokens;
        if (!nextTokens) {
          throw new Error('Session unavailable.');
        }

        const { user } = await fetchCurrentUser(nextTokens.accessToken);
        let imageConsent: ImageConsent | null = null;
        let onboardingSnapshot: OnboardingSnapshot | null = null;
        try {
          const response = await fetchImageConsent(nextTokens.accessToken);
          imageConsent = response.consent;
        } catch {
          imageConsent = null;
        }
        try {
          const response = await fetchOnboardingFromBackend(nextTokens.accessToken);
          onboardingSnapshot = response.record;
        } catch {
          onboardingSnapshot = null;
        }

        useUiStore.getState().setPreferences(user.preferences);
        useOnboardingStore.getState().setOnboardingCompleted(deriveOnboardingCompleted(user, onboardingSnapshot));
        set({ user, imageConsent, onboardingSnapshot, isHydrated: true });
        await persistSession({ user, tokens: nextTokens });
      }
    } catch (err) {
      // Only clear the session for genuine auth failures, not network issues.
      // This prevents logging users out just because the backend was restarting.
      const isNetworkErr = (() => {
        if (!err) return false;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Network Error') || msg.includes('ECONNREFUSED') ||
            msg.includes('ENOTFOUND') || msg.includes('timeout') ||
            msg.includes('API_BASE_URL=')) {
          return true;
        }
        const status = (err as any)?.response?.status;
        if (!status) return true;
        return false;
      })();

      if (isNetworkErr) {
        console.warn('[Auth] Network error during initialization — keeping cached session if available.');
        // Keep whatever session we already have in state (set earlier)
        set({ isHydrated: true });
        return;
      }

      console.error('Auth initialization error (clearing session):', err);
      try {
        await persistSession(null);
      } catch (storageErr) {
        console.error('Failed to clear session storage during recovery:', storageErr);
      }
      set({ user: null, tokens: null, imageConsent: null, onboardingSnapshot: null, isHydrated: true });
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

  resendOtp: async (payload) => {
    set({ isLoading: true });
    try {
      await resendOtpApi(payload);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (identifier, password, rememberMe = true) => {
    set({ isLoading: true });
    try {
      const response = await loginUser({ identifier, password });
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        sessionSecret: response.sessionSecret,
      };

      // Persist rememberMe preference
      await setSecureItem(rememberMeKey, rememberMe);
      set({ rememberMe });

      if (rememberMe) {
        await persistSession({ user: response.user, tokens });
      }

      useUiStore.getState().setPreferences(response.user.preferences);
      let onboardingSnapshot: OnboardingSnapshot | null = null;
      try {
        const onboardingResponse = await fetchOnboardingFromBackend(tokens.accessToken);
        onboardingSnapshot = onboardingResponse.record;
      } catch {
        onboardingSnapshot = null;
      }
      useOnboardingStore.getState().setOnboardingCompleted(
        deriveOnboardingCompleted(response.user, onboardingSnapshot)
      );
      set({
        user: response.user,
        tokens,
        onboardingSnapshot,
        lastActivityAt: Date.now(),
        sessionWarning: false,
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
        // Clear local session even if network request fails
      }
    }

    await persistSession(null);
    useUiStore.getState().reset();
    useOnboardingStore.getState().resetOnboarding().catch(() => {});
    set({
      user: null,
      tokens: null,
      imageConsent: null,
      onboardingSnapshot: null,
      isLoading: false,
      lastActivityAt: Date.now(),
      sessionWarning: false,
    });
  },

  touchActivity: () => set({ lastActivityAt: Date.now(), sessionWarning: false }),

  refreshAccessToken: async () => {
    const tokens = get().tokens;
    if (!tokens) return;

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
    if (get().user && get().rememberMe) {
      await persistSession({ user: get().user as User, tokens: updatedTokens });
    }
  },

  refreshOnboardingSnapshot: async () => {
    const tokens = get().tokens;
    if (!tokens) return;

    try {
      const response = await fetchOnboardingFromBackend(tokens.accessToken);
      const onboardingSnapshot = response.record;
      set({ onboardingSnapshot });
      useOnboardingStore.getState().setOnboardingCompleted(
        deriveOnboardingCompleted(get().user, onboardingSnapshot)
      );
    } catch {
      // Keep cached state if the backend snapshot is unavailable.
    }
  },

  checkInactivity: async () => {
    if (!get().tokens) return false;

    const elapsed = Date.now() - get().lastActivityAt;

    if (elapsed >= SESSION_TIMEOUT_MS) {
      await get().logout();
      return true;
    }

    // Warn when within SESSION_WARNING_MS of timeout
    if (elapsed >= SESSION_TIMEOUT_MS - SESSION_WARNING_MS) {
      set({ sessionWarning: true });
    } else {
      set({ sessionWarning: false });
    }

    return false;
  },

  updateProfile: async (payload) => {
    const tokens = get().tokens;
    if (!tokens) throw new Error('You need to log in first.');

    set({ isLoading: true });
    try {
      const response = await updateUserProfile(tokens.accessToken, payload);
      if (get().rememberMe) {
        await persistSession({ user: response.user, tokens });
      }
      set({ user: response.user, lastActivityAt: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePreferences: async (payload) => {
    const tokens = get().tokens;
    if (!tokens) throw new Error('You need to log in first.');

    set({ isLoading: true });
    try {
      const response = await updateUserPreferences(tokens.accessToken, payload);
      if (get().rememberMe) {
        await persistSession({ user: response.user, tokens });
      }
      useUiStore.getState().setPreferences(response.user.preferences);
      set({ user: response.user, lastActivityAt: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  updateFitnessGoals: async (payload) => {
    const tokens = get().tokens;
    if (!tokens) throw new Error('You need to log in first.');

    set({ isLoading: true });
    try {
      const response = await updateFitnessGoalsApi(tokens.accessToken, payload);
      if (get().rememberMe) {
        await persistSession({ user: response.user, tokens });
      }
      set({ user: response.user, lastActivityAt: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  saveOnboardingProfile: async (payload) => {
    const tokens = get().tokens;
    if (!tokens) throw new Error('You need to log in first.');

    set({ isLoading: true });
    try {
      const response = await saveOnboardingProfileApi(tokens.accessToken, payload);
      if (get().rememberMe) {
        await persistSession({ user: response.user, tokens });
      }
      set({ user: response.user, lastActivityAt: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadProfilePicture: async (imageUri) => {
    const tokens = get().tokens;
    if (!tokens) throw new Error('You need to log in first.');

    set({ isLoading: true, uploadProgress: 0 });
    try {
      const formData = new FormData();
      const match = /\.(\w+)$/.exec(imageUri);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, `profile.${match ? match[1] : 'jpg'}`);
      } else {
        formData.append('image', {
          uri: imageUri,
          name: `profile.${match ? match[1] : 'jpg'}`,
          type,
        } as any);
      }

      let response;
      if (Platform.OS === 'web') {
        // Browser: use fetch (no reliable progress from fetch), show indeterminate state
        const uploadResponse = await fetch(`${API_BASE_URL}/users/profile/picture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: formData,
        });

        const payload = await uploadResponse.json().catch(() => null);
        if (!uploadResponse.ok) {
          throw new Error(payload?.message ?? 'Could not upload picture.');
        }

        response = payload as { message: string; profilePictureUrl: string; user: User };
      } else {
        // Native: use axios client to track upload progress
        const { apiClient } = require('@/services/api/client');
        const uploadResp = await apiClient.post('/users/profile/picture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (ev: { loaded: number; total?: number }) => {
            try {
              const total = ev.total ?? 0;
              if (!total) {
                set({ uploadProgress: 0 });
              } else {
                set({ uploadProgress: Math.min(1, ev.loaded / total) });
              }
            } catch (e) {}
          },
        });
        response = uploadResp.data as { message: string; profilePictureUrl: string; user: User };
      }
      if (get().rememberMe) {
        await persistSession({ user: response.user, tokens });
      }
      set({ user: response.user, lastActivityAt: Date.now() });
    } finally {
      set({ isLoading: false, uploadProgress: null });
    }
  },

  deactivateAccount: async () => {
    const tokens = get().tokens;
    if (!tokens) throw new Error('You need to log in first.');

    await deactivateUser(tokens.accessToken);
    await get().logout();
  },

  deleteAccount: async (confirmation) => {
    const tokens = get().tokens;
    if (!tokens) throw new Error('You need to log in first.');

    await deleteUser(tokens.accessToken, confirmation);
    await get().logout();
  },

  loadImageConsent: async () => {
    const tokens = get().tokens;
    if (!tokens) throw new Error('You need to log in first.');

    const response = await fetchImageConsent(tokens.accessToken);
    set({ imageConsent: response.consent });
  },

  saveImageConsent: async (payload) => {
    const tokens = get().tokens;
    if (!tokens) throw new Error('You need to log in first.');

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
    if (!tokens) throw new Error('You need to log in first.');

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
    if (!tokens) throw new Error('You need to log in first.');

    set({ isLoading: true });
    try {
      const response = await deleteStoredImages(tokens.accessToken);
      set({ imageConsent: response.consent });
    } finally {
      set({ isLoading: false });
    }
  },

  setRememberMe: async (value) => {
    await setSecureItem(rememberMeKey, value);
    set({ rememberMe: value });
  },

  dismissSessionWarning: () => set({ sessionWarning: false }),
}));
