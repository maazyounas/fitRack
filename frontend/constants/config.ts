import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 4000;

function appendApiPath(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, '')}/api`;
}

function buildUrlFromHost(hostname: string) {
  return appendApiPath(`http://${hostname}:${BACKEND_PORT}`);
}

function getWebBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:4000/api';
  }

  const hostname = window.location.hostname?.trim();

  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000/api';
  }

  return buildUrlFromHost(hostname);
}

function getExpoHostBaseUrl() {
  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    return null;
  }

  const hostname = hostUri.split(':')[0]?.trim();

  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  return buildUrlFromHost(hostname);
}

function normalizeConfiguredBaseUrl(baseUrl: string) {
  return appendApiPath(baseUrl.trim().replace(/\/api\/?$/, ''));
}

function getHostnameFromBaseUrl(baseUrl: string) {
  const match = baseUrl.match(/^https?:\/\/([^/:]+)(?::\d+)?/i);
  return match?.[1]?.trim() ?? null;
}

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return getWebBaseUrl();
  }

  const expoHostBaseUrl = getExpoHostBaseUrl();
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (expoHostBaseUrl) {
    return expoHostBaseUrl;
  }

  if (configuredBaseUrl) {
    return normalizeConfiguredBaseUrl(configuredBaseUrl);
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }

  // Fallbacks for development
  // Default for iOS or others
  return 'http://localhost:4000/api';
};

export const API_BASE_URL = getBaseUrl();

export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
export const SESSION_WARNING_MS = 60 * 1000;
