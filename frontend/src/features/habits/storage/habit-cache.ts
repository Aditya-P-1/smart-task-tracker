import { STORAGE_KEYS } from '../../../constants/storage-keys';
import { storageService } from '../../../storage/mmkv';

import type { CachedHabitList, HabitListItem } from '../types/habit';

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

export function getCachedHabitList(userId: string) {
  const rawCache = storageService.getString(STORAGE_KEYS.habitListCache);

  if (!rawCache) {
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
      return null;
    }

    return parsedCache;
  } catch {
    clearHabitListCache();
    return null;
  }
}

export function saveHabitListCache(userId: string, habits: HabitListItem[]) {
  const payload: CachedHabitList = {
    habits: serializeHabits(habits),
    updatedAt: new Date().toISOString(),
    userId,
  };

  storageService.set(STORAGE_KEYS.habitListCache, JSON.stringify(payload));
}

export function clearHabitListCache() {
  storageService.remove(STORAGE_KEYS.habitListCache);
}
