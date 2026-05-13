import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.trim();
  }

  // Fallbacks for development
  if (Platform.OS === 'web') {
    return 'http://localhost:4000/api';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }
  // Default for iOS or others
  return 'http://localhost:4000/api';
};

export const API_BASE_URL = getBaseUrl();

export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
export const SESSION_WARNING_MS = 60 * 1000;
