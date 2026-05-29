/**
 * Axios-based API client with automatic JWT refresh.
 *
 * Request interceptor  → attaches Authorization: Bearer <accessToken>
 * Response interceptor → on 401, silently refreshes the access token and retries
 *                        the original request once. Concurrent 401s are queued
 *                        and resolved together after a single refresh call.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/config';

// ─── Axios Instance ──────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  timeout: 15000,
});

// ─── Refresh State ───────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, newToken: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error || !newToken) reject(error);
    else resolve(newToken!);
  });
  refreshQueue = [];
}

// ─── Request Interceptor: Attach Access Token ────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    // Lazy import to avoid circular dependency. The store is set at runtime.
    const { useAuthStore } = require('@/store/authStore');
    const accessToken = useAuthStore.getState().tokens?.accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 + Auto-Refresh ────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url ?? '';
    const isAuthRoute = /\/auth\/(login|refresh|register|verify|resend-otp|forgot-password|reset-password|logout)/.test(requestUrl);

    if (originalRequest.headers?.['x-skip-auth-refresh'] === '1' || isAuthRoute) {
      return Promise.reject(extractApiError(error));
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(extractApiError(error));
    }

    if (isRefreshing) {
      // Queue this request until the ongoing refresh finishes
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        originalRequest._retry = true;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { useAuthStore } = require('@/store/authStore');
      await useAuthStore.getState().refreshAccessToken();
      const newToken = useAuthStore.getState().tokens?.accessToken ?? '';
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — logout and propagate
      const { useAuthStore } = require('@/store/authStore');
      await useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Error Extractor ─────────────────────────────────────────────────────────

function extractApiError(error: AxiosError): Error {
  const data = error.response?.data as Record<string, unknown> | undefined;
  const message =
    typeof data?.message === 'string'
      ? data.message
      : error.message || 'Request failed.';
  // If this was a network-level error (no response), include the API base URL to help debugging
  if (!error.response) {
    return new Error(`${message} (API_BASE_URL=${API_BASE_URL})`);
  }

  return new Error(message);
}

// ─── Generic Request Helper ───────────────────────────────────────────────────

export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    accessToken?: string | null;
    isFormData?: boolean;
    skipAuthRefresh?: boolean;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.isFormData) {
    if (Platform.OS !== 'web') {
      headers['Content-Type'] = 'multipart/form-data';
    }
  }
  if (options.skipAuthRefresh) {
    headers['x-skip-auth-refresh'] = '1';
  }

  const response = await apiClient.request<T>({
    url: path,
    method: options.method ?? 'GET',
    data: options.body,
    headers,
  });

  return response.data;
}
