import * as SecureStore from 'expo-secure-store';

const storagePrefix = 'fitrack';

function buildKey(key: string) {
  return `${storagePrefix}:${key}`;
}

export async function setSecureItem<T>(key: string, value: T) {
  await SecureStore.setItemAsync(buildKey(key), JSON.stringify(value));
}

export async function getSecureItem<T>(key: string) {
  const rawValue = await SecureStore.getItemAsync(buildKey(key));
  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue) as T;
}

export async function removeSecureItem(key: string) {
  await SecureStore.deleteItemAsync(buildKey(key));
}
