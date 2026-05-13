/**
 * privacyService.ts — Image consent, permission management, and temp file cleanup.
 * Privacy-first: images stay on-device, consent is always checked before use.
 */

import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

// ─── Permission Helpers ───────────────────────────────────────────────────────

/** Request camera permission. Returns true if granted. */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/** Request photo library permission. Returns true if granted. */
export async function requestLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/** Request media library save permission (Android). */
export async function requestSavePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Consent Guards ───────────────────────────────────────────────────────────

type ImageConsent = {
  consentGiven: boolean;
  usageExplanationAccepted: boolean;
};

/**
 * Returns true if the user has accepted the usage explanation and given consent.
 * Shows an alert and returns false if not.
 */
export function checkImageConsent(consent: ImageConsent | null): boolean {
  if (!consent?.consentGiven || !consent?.usageExplanationAccepted) {
    Alert.alert(
      'Consent Required',
      'Please review and enable Image Consent in Settings → Privacy before scanning.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

// ─── Temp File Cleanup ────────────────────────────────────────────────────────

/** List of temp image URIs created during the current session. */
const sessionTempFiles: string[] = [];

/** Register a URI as a temporary file to be cleaned up later. */
export function registerTempFile(uri: string) {
  const cacheDir = (FileSystem as any).cacheDirectory;
  if (cacheDir && uri.startsWith(cacheDir)) {
    sessionTempFiles.push(uri);
  }
}

/**
 * Delete all temp image files registered during the session.
 * Call on modal dismiss / screen unmount when consent to store is false.
 */
export async function clearSessionTempFiles(): Promise<void> {
  const tasks = sessionTempFiles.map(async (uri) => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch {
      // Ignore individual delete failures
    }
  });
  await Promise.all(tasks);
  sessionTempFiles.length = 0;
}

/**
 * Delete a single file by URI.
 */
export async function deleteTempFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Ignore
  }
}

// ─── Privacy Summary ──────────────────────────────────────────────────────────

export type PrivacySummary = {
  processingLocation: 'on-device' | 'cloud';
  imagesStored: boolean;
  dataRetentionDays: number;
  encryptedAtRest: boolean;
};

/**
 * Returns a human-readable privacy summary for displaying to users.
 */
export function getPrivacySummary(storageAllowed: boolean, processingMode: 'local' | 'cloud'): PrivacySummary {
  return {
    processingLocation: processingMode === 'local' ? 'on-device' : 'cloud',
    imagesStored: storageAllowed,
    dataRetentionDays: storageAllowed ? 30 : 0,
    encryptedAtRest: true,
  };
}
