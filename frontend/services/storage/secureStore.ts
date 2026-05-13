import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storagePrefix = 'fitrack';

function buildKey(key: string) {
  return `${storagePrefix}_${key}`;
}

const isWeb = Platform.OS === 'web';

export async function setSecureItem<T>(key: string, value: T) {
  const fullKey = buildKey(key);
  const stringValue = JSON.stringify(value);

  if (isWeb) {
    await AsyncStorage.setItem(fullKey, stringValue);
  } else {
    await SecureStore.setItemAsync(fullKey, stringValue);
  }
}

export async function getSecureItem<T>(key: string) {
  const fullKey = buildKey(key);
  let rawValue: string | null = null;

  if (isWeb) {
    rawValue = await AsyncStorage.getItem(fullKey);
  } else {
    rawValue = await SecureStore.getItemAsync(fullKey);
  }

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch (err) {
    console.error(`Failed to parse stored item for key ${fullKey}:`, err);
    return null;
  }
}

export async function removeSecureItem(key: string) {
  const fullKey = buildKey(key);

  if (isWeb) {
    await AsyncStorage.removeItem(fullKey);
  } else {
    await SecureStore.deleteItemAsync(fullKey);
  }
}
