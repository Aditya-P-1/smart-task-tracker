import { STORAGE_KEYS } from '../../../constants/storage-keys';
import { storageService } from '../../../storage/mmkv';

import type { CachedHabitList, HabitListItem } from '../types/habit';

let cachedHabitList: CachedHabitList | null = null;
let cachedHabitSnapshot: string | null = null;

function serializeHabits(habits: HabitListItem[]) {
  return habits.map(
    ({
      completedToday: _completedToday,
      isPending: _isPending,
      latestCheckInLabel: _latestCheckInLabel,
      ...habit
    }) => habit,
  );
}

function buildHabitCacheSnapshot(userId: string, habits: HabitListItem[]) {
  return JSON.stringify({
    habits: serializeHabits(habits),
    userId,
  });
}

function rememberHabitCache(cache: CachedHabitList) {
  cachedHabitList = cache;
  cachedHabitSnapshot = buildHabitCacheSnapshot(cache.userId, cache.habits);
}

export function getCachedHabitList(userId: string) {
  if (cachedHabitList?.userId === userId) {
    return cachedHabitList;
  }

  const rawCache = storageService.getString(STORAGE_KEYS.habitListCache);

  if (!rawCache) {
    cachedHabitList = null;
    cachedHabitSnapshot = null;
    return null;
  }

  try {
    const parsedCache = JSON.parse(rawCache) as CachedHabitList;

    if (
      !parsedCache ||
      parsedCache.userId !== userId ||
      !Array.isArray(parsedCache.habits) ||
      typeof parsedCache.updatedAt !== 'string'
    ) {
      cachedHabitList = null;
      cachedHabitSnapshot = null;
      return null;
    }

    rememberHabitCache(parsedCache);
    return parsedCache;
  } catch {
    clearHabitListCache();
    return null;
  }
}

export function createHabitCacheSnapshot(userId: string, habits: HabitListItem[]) {
  return buildHabitCacheSnapshot(userId, habits);
}

export function saveHabitListCache(userId: string, habits: HabitListItem[]) {
  const serializedHabits = serializeHabits(habits);
  const nextSnapshot = JSON.stringify({
    habits: serializedHabits,
    userId,
  });

  if (cachedHabitSnapshot === nextSnapshot) {
    return;
  }

  const payload: CachedHabitList = {
    habits: serializedHabits,
    updatedAt: new Date().toISOString(),
    userId,
  };

  rememberHabitCache(payload);
  storageService.set(STORAGE_KEYS.habitListCache, JSON.stringify(payload));
}

export function clearHabitListCache() {
  cachedHabitList = null;
  cachedHabitSnapshot = null;
  storageService.remove(STORAGE_KEYS.habitListCache);
}
