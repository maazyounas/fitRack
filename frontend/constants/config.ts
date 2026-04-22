export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'http://10.0.2.2:4000/api';

export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
export const SESSION_WARNING_MS = 60 * 1000;
