import { create } from 'zustand';
import { getLocales } from 'expo-localization';
import { UserPreferences } from '@/types/user';

type UiState = {
  themeOverride: 'light' | 'dark' | null;
  highContrastMode: boolean;
  fontScale: number;
  language: 'en' | 'ur';
  autoDetectLanguage: boolean;
  resolvedLanguage: 'en' | 'ur';
  voiceCommandsEnabled: boolean;
  textToSpeechEnabled: boolean;
  adaptiveDifficulty: boolean;
  setThemeOverride: (theme: 'light' | 'dark' | null) => void;
  setPreferences: (preferences: UserPreferences) => void;
  reset: () => void;
};

function detectLanguage() {
  const localeTag = getLocales()[0]?.languageCode?.toLowerCase() ?? 'en';
  return localeTag === 'ur' ? 'ur' : 'en';
}

export const useUiStore = create<UiState>((set) => ({
  themeOverride: null,
  highContrastMode: false,
  fontScale: 1,
  language: 'en',
  autoDetectLanguage: true,
  resolvedLanguage: detectLanguage(),
  voiceCommandsEnabled: false,
  textToSpeechEnabled: false,
  adaptiveDifficulty: true,
  setThemeOverride: (themeOverride) => set({ themeOverride }),
  setPreferences: (preferences) =>
    set({
      themeOverride: preferences.darkMode ? 'dark' : 'light',
      highContrastMode: preferences.highContrastMode,
      fontScale: preferences.fontScale,
      language: preferences.language,
      autoDetectLanguage: preferences.autoDetectLanguage,
      resolvedLanguage: preferences.autoDetectLanguage ? detectLanguage() : preferences.language,
      voiceCommandsEnabled: preferences.voiceCommandsEnabled,
      textToSpeechEnabled: preferences.textToSpeechEnabled,
      adaptiveDifficulty: preferences.adaptiveDifficulty,
    }),
  reset: () =>
    set({
      themeOverride: null,
      highContrastMode: false,
      fontScale: 1,
      language: 'en',
      autoDetectLanguage: true,
      resolvedLanguage: detectLanguage(),
      voiceCommandsEnabled: false,
      textToSpeechEnabled: false,
      adaptiveDifficulty: true,
    }),
}));
