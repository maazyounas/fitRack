import {
  AuthResponse,
  ImageConsent,
  LoginPayload,
  RegisterPayload,
  UpdatePreferencesPayload,
  UpdateProfilePayload,
  User,
  FitnessGoals,
} from '@/types/user';
import { apiRequest } from './client';

export function registerUser(payload: RegisterPayload) {
  return apiRequest<{ message: string; user: User }>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export function verifyRegistrationOtp(payload: {
  identifier: string;
  otp: string;
  purpose: 'verify-email' | 'verify-phone';
}) {
  return apiRequest<{ message: string }>('/auth/verify', {
    method: 'POST',
    body: payload,
  });
}

export function resendOtp(payload: {
  identifier: string;
  purpose: 'verify-email' | 'verify-phone';
}) {
  return apiRequest<{ message: string }>('/auth/resend-otp', {
    method: 'POST',
    body: payload,
  });
}

export function loginUser(payload: LoginPayload) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function refreshSession(payload: { refreshToken: string; sessionSecret: string }) {
  return apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
    method: 'POST',
    body: payload,
  });
}

export function requestPasswordReset(identifier: string) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { identifier },
  });
}

export function resetPassword(payload: { identifier: string; otp: string; newPassword: string }) {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: payload,
  });
}

export function logoutUser(refreshToken?: string) {
  return apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  });
}

export function fetchCurrentUser(accessToken: string) {
  return apiRequest<{ user: User }>('/users/me', {
    accessToken,
  });
}

export function updateUserProfile(accessToken: string, payload: UpdateProfilePayload) {
  return apiRequest<{ message: string; user: User }>('/users/profile', {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function uploadProfilePicture(accessToken: string, formData: FormData) {
  return apiRequest<{ message: string; profilePictureUrl: string; user: User }>('/users/profile/picture', {
    method: 'POST',
    accessToken,
    body: formData,
    isFormData: true,
  });
}

export function getFitnessGoals(accessToken: string) {
  return apiRequest<{ fitnessGoals: FitnessGoals }>('/users/fitness-goals', {
    accessToken,
  });
}

export function updateFitnessGoals(accessToken: string, payload: Partial<FitnessGoals>) {
  return apiRequest<{ message: string; user: User }>('/users/fitness-goals', {
    method: 'PUT',
    accessToken,
    body: payload,
  });
}

export function updateUserPreferences(accessToken: string, payload: UpdatePreferencesPayload) {
  return apiRequest<{ message: string; user: User }>('/users/preferences', {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function deactivateUser(accessToken: string) {
  return apiRequest<{ message: string }>('/users/deactivate', {
    method: 'POST',
    accessToken,
  });
}

export function deleteUser(accessToken: string, confirmation: string) {
  return apiRequest<{ message: string }>('/users', {
    method: 'DELETE',
    accessToken,
    body: { confirmation },
  });
}

export function fetchImageConsent(accessToken: string) {
  return apiRequest<{ consent: ImageConsent }>('/users/image-consent', {
    accessToken,
  });
}

export function updateImageConsent(
  accessToken: string,
  payload: Partial<Pick<ImageConsent, 'consentGiven' | 'usageExplanationAccepted' | 'processingMode' | 'storageAllowed'>>
) {
  return apiRequest<{ message: string; consent: ImageConsent }>('/users/image-consent', {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function revokeImageConsent(accessToken: string) {
  return apiRequest<{ message: string; consent: ImageConsent }>('/users/image-consent/revoke', {
    method: 'POST',
    accessToken,
  });
}

export function deleteStoredImages(accessToken: string) {
  return apiRequest<{ message: string; consent: ImageConsent }>('/users/image-consent/images', {
    method: 'DELETE',
    accessToken,
  });
}
