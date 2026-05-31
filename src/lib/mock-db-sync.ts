import { apiClient } from '@/services/apiClient';
import type { CourseProgress, VideoProgress } from '@/types';
import type { MockDbSnapshot } from '@/types/mock-db';
import { mergeSnapshots, snapshotFingerprint } from '@/lib/mock-db-merge';
import { getStoredMockDb, setStoredMockDb } from '@/lib/mock-db-storage';
import { loadProgressFromStorage } from '@/lib/progress-storage';
import { PROGRESS_KEY } from '@/lib/storage-keys';

/** Internal requests skip the hydrate interceptor to avoid recursive sync. */
export const SKIP_MOCK_HYDRATE_HEADER = 'x-aaft-skip-mock-hydrate';

let syncChain: Promise<void> = Promise.resolve();
let lastSyncedFingerprint: string | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function runSync<T>(fn: () => Promise<T>): Promise<T> {
  const result = syncChain.then(fn);
  syncChain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export function invalidateMockDbSyncCache(): void {
  lastSyncedFingerprint = null;
}

function buildCourseProgressMap(snapshot: MockDbSnapshot): Record<string, CourseProgress> {
  const map: Record<string, CourseProgress> = {};
  for (const course of snapshot.courses) {
    const total = course.lessons.length;
    const completed = course.lessons.filter((l) => snapshot.videoProgress[l.id]?.isCompleted).length;
    map[course.id] = {
      completedVideos: completed,
      totalVideos: total,
      percentage: total ? Math.round((completed / total) * 100) : 0,
    };
  }
  return map;
}

function mergeVideoProgress(
  snapshot: MockDbSnapshot,
  videoProgress: Record<string, VideoProgress>
): MockDbSnapshot {
  return {
    ...snapshot,
    videoProgress: { ...snapshot.videoProgress, ...videoProgress },
  };
}

function withProgress(snapshot: MockDbSnapshot): MockDbSnapshot {
  const progressData = loadProgressFromStorage();
  return mergeVideoProgress(snapshot, progressData.videoProgress);
}

/** Never replace localStorage with a snapshot that has fewer entities than before. */
function saveSnapshotMergedWithLocal(incoming: MockDbSnapshot): MockDbSnapshot {
  const stored = getStoredMockDb();
  const merged = stored ? mergeSnapshots(incoming, withProgress(stored)) : incoming;
  setStoredMockDb(merged);
  syncProgressStorageFromSnapshot(merged);
  return merged;
}

/** Sync Redux progress localStorage from a mock DB snapshot. */
export function syncProgressStorageFromSnapshot(snapshot: MockDbSnapshot): void {
  if (typeof window === 'undefined') return;
  const courseProgress = buildCourseProgressMap(snapshot);
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({ videoProgress: snapshot.videoProgress, courseProgress })
  );
}

async function fetchServerSnapshot(): Promise<MockDbSnapshot | null> {
  try {
    const { data } = await apiClient.get<MockDbSnapshot>('/mock/state', {
      headers: { [SKIP_MOCK_HYDRATE_HEADER]: '1' },
    });
    return data;
  } catch {
    return null;
  }
}

async function pushSnapshotToServer(snapshot: MockDbSnapshot): Promise<void> {
  await apiClient.post('/mock/state', snapshot, {
    headers: { [SKIP_MOCK_HYDRATE_HEADER]: '1' },
  });
  setStoredMockDb(snapshot);
  syncProgressStorageFromSnapshot(snapshot);
  lastSyncedFingerprint = snapshotFingerprint(snapshot);
}

/**
 * After admin CRUD: push the patched localStorage snapshot to the server.
 * Does NOT read server first (avoids overwriting local with stale in-memory seed).
 */
export async function commitLocalSnapshotToServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  return runSync(async () => {
    const stored = getStoredMockDb();
    if (!stored) {
      await pullServerIntoLocal();
      return;
    }
    const localMerged = withProgress(stored);
    const server = await fetchServerSnapshot();
    const merged = server ? mergeSnapshots(server, localMerged) : localMerged;
    await pushSnapshotToServer(merged);
  });
}

/** Pull server state and union-merge into localStorage (never drops local-only entities). */
async function pullServerIntoLocal(): Promise<MockDbSnapshot | null> {
  const server = await fetchServerSnapshot();
  if (!server) return null;
  const merged = saveSnapshotMergedWithLocal(server);
  lastSyncedFingerprint = snapshotFingerprint(merged);
  return merged;
}

/**
 * Merge localStorage with server and push if they differ.
 * Safe to call before every API read — never drops newer local entities.
 */
async function syncLocalWithServer(): Promise<void> {
  const stored = getStoredMockDb();
  const progressData = loadProgressFromStorage();
  const hasProgress = Object.keys(progressData.videoProgress).length > 0;

  if (!stored && !hasProgress) return;

  if (stored) {
    const localMerged = withProgress(stored);
    const localFp = snapshotFingerprint(localMerged);
    if (localFp === lastSyncedFingerprint) return;

    const server = await fetchServerSnapshot();
    const merged = server ? mergeSnapshots(server, localMerged) : localMerged;
    const mergedFp = snapshotFingerprint(merged);

    if (!server || mergedFp !== snapshotFingerprint(server)) {
      await pushSnapshotToServer(merged);
    } else {
      setStoredMockDb(merged);
      syncProgressStorageFromSnapshot(merged);
      lastSyncedFingerprint = mergedFp;
    }
    return;
  }

  if (hasProgress) {
    const server = await fetchServerSnapshot();
    if (!server) return;
    const merged = mergeVideoProgress(server, progressData.videoProgress);
    await pushSnapshotToServer(merged);
  }
}

export function resetMockDbHydration(): void {
  invalidateMockDbSyncCache();
}

export function ensureMockDbHydrated(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  const hasMockDb = !!getStoredMockDb();
  const progress = loadProgressFromStorage();
  const hasProgress = Object.keys(progress.videoProgress).length > 0;
  if (!hasMockDb && !hasProgress) return Promise.resolve();

  return runSync(() => syncLocalWithServer());
}

/** Pull server into local using union merge (safe for background/debounced sync). */
export async function persistMockDbFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  return runSync(async () => {
    try {
      const server = await fetchServerSnapshot();
      if (!server) return;
      const merged = saveSnapshotMergedWithLocal(server);
      const serverFp = snapshotFingerprint(server);
      const mergedFp = snapshotFingerprint(merged);
      if (mergedFp !== serverFp) {
        await pushSnapshotToServer(merged);
      } else {
        lastSyncedFingerprint = mergedFp;
      }
    } catch {
      /* ignore */
    }
  });
}

/** @deprecated Use commitLocalSnapshotToServer after mutations. */
export async function flushMockDbPersist(): Promise<void> {
  return commitLocalSnapshotToServer();
}

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export function scheduleMockDbPersist(method?: string, url?: string): void {
  if (typeof window === 'undefined') return;
  const m = method?.toLowerCase();
  if (!m || !MUTATING_METHODS.has(m)) return;
  if (url?.includes('/mock/state')) return;

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistMockDbFromServer();
  }, 400);
}

function registerLifecycleSync(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    invalidateMockDbSyncCache();
    void ensureMockDbHydrated();
  });

  window.addEventListener('pagehide', () => {
    void commitLocalSnapshotToServer();
  });
}

registerLifecycleSync();
