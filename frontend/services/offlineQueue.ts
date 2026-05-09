/**
 * offlineQueue.ts
 * Stores workout logs in AsyncStorage when offline.
 * Automatically syncs queued items when connectivity is restored.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { apiRequest } from './api/client';
import { useAuthStore } from '@/store/authStore';

const QUEUE_KEY = '@fitrack:offline_workout_queue';

export type OfflineWorkoutLog = {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  body: Record<string, unknown>;
  queuedAt: string;
};

// ── Enqueue ────────────────────────────────────────────────────────────────
export async function enqueueWorkoutLog(
  endpoint: string,
  body: Record<string, unknown>
): Promise<void> {
  const existing = await loadQueue();
  const item: OfflineWorkoutLog = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    endpoint,
    method: 'POST',
    body,
    queuedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, item]));
  console.log(`[OfflineQueue] Queued ${endpoint} (${existing.length + 1} total)`);
}

// ── Load queue ─────────────────────────────────────────────────────────────
async function loadQueue(): Promise<OfflineWorkoutLog[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as OfflineWorkoutLog[]) : [];
}

// ── Flush queue ────────────────────────────────────────────────────────────
export async function flushOfflineQueue(): Promise<void> {
  const queue = await loadQueue();
  if (!queue.length) return;

  const accessToken = useAuthStore.getState().tokens?.accessToken;
  if (!accessToken) {
    console.warn('[OfflineQueue] No access token — skipping flush');
    return;
  }

  console.log(`[OfflineQueue] Flushing ${queue.length} queued items...`);
  const failed: OfflineWorkoutLog[] = [];

  for (const item of queue) {
    try {
      await apiRequest(item.endpoint, {
        method: item.method,
        accessToken,
        body: item.body,
      });
      console.log(`[OfflineQueue] ✅ Synced ${item.endpoint} (queued at ${item.queuedAt})`);
    } catch (error) {
      console.error(`[OfflineQueue] ❌ Failed to sync ${item.endpoint}`, error);
      failed.push(item);
    }
  }

  // Persist only items that still failed
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  console.log(`[OfflineQueue] Flush complete. ${failed.length} items remain.`);
}

// ── Network listener ───────────────────────────────────────────────────────
let unsubscribeNetInfo: (() => void) | null = null;

export function startOfflineSync(): void {
  if (unsubscribeNetInfo) return; // already listening

  unsubscribeNetInfo = NetInfo.addEventListener((state: any) => {
    if (state.isConnected && state.isInternetReachable) {
      void flushOfflineQueue();
    }
  });

  console.log('[OfflineQueue] Network listener started');
}

export function stopOfflineSync(): void {
  unsubscribeNetInfo?.();
  unsubscribeNetInfo = null;
}

// ── Queue size helper (for UI badge) ─────────────────────────────────────
export async function getQueueSize(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}
