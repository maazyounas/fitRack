import { AccessibilityInfo, Platform } from 'react-native';

type VoiceRecognition = {
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
};

type VoiceResult = {
  supported: boolean;
  transcript?: string;
  error?: string;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => VoiceRecognition;
    webkitSpeechRecognition?: new () => VoiceRecognition;
  }
}

export async function speakText(text: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
    return true;
  }

  await AccessibilityInfo.announceForAccessibility(text);
  return true;
}

export async function startVoiceRecognition(language: 'en' | 'ur'): Promise<VoiceResult> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return { supported: false, error: 'unsupported' };
  }

  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Recognition) {
    return { supported: false, error: 'unsupported' };
  }

  return await new Promise<VoiceResult>((resolve) => {
    const recognition = new Recognition();
    recognition.lang = language === 'ur' ? 'ur-PK' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      recognition.stop();
      resolve({ supported: true, transcript });
    };
    recognition.onerror = (event: any) => {
      recognition.stop();
      resolve({ supported: true, error: event.error ?? 'error' });
    };
    recognition.start();
  });
}

export function parseVoiceRoute(transcript: string) {
  const normalized = transcript.toLowerCase();
  if (normalized.includes('home') || normalized.includes('ہوم')) return '/(tabs)/home';
  if (normalized.includes('workout') || normalized.includes('ورک')) return '/(tabs)/workouts';
  if (normalized.includes('nutrition') || normalized.includes('meal') || normalized.includes('غذا')) {
    return '/(tabs)/nutrition';
  }
  if (normalized.includes('progress') || normalized.includes('پیش')) return '/(tabs)/progress';
  if (normalized.includes('community') || normalized.includes('کمیونٹی')) return '/(tabs)/community';
  if (normalized.includes('profile') || normalized.includes('پروفائل')) return '/(tabs)/profile';
  if (normalized.includes('setting') || normalized.includes('ترتیب')) return '/(tabs)/settings';
  return null;
}
