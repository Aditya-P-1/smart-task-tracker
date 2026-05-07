import { STORAGE_KEYS } from '../../../constants/storage-keys';
import { storageService } from '../../../storage/mmkv';

import type { CachedTaskList, TaskListItem } from '../types/task';

function serializeTasks(tasks: TaskListItem[]) {
  return tasks.map(({ isPending: _isPending, ...task }) => task);
}

export function getCachedTaskList(userId: string) {
  const rawCache = storageService.getString(STORAGE_KEYS.taskListCache);

  if (!rawCache) {
    return null;
  }

  try {
    const parsedCache = JSON.parse(rawCache) as CachedTaskList;

    if (
      !parsedCache ||
      parsedCache.userId !== userId ||
      !Array.isArray(parsedCache.tasks) ||
      typeof parsedCache.updatedAt !== 'string'
    ) {
      return null;
    }

    return parsedCache;
  } catch {
    clearTaskListCache();
    return null;
  }
}

export function saveTaskListCache(userId: string, tasks: TaskListItem[]) {
  const payload: CachedTaskList = {
    tasks: serializeTasks(tasks),
    updatedAt: new Date().toISOString(),
    userId,
  };

  storageService.set(STORAGE_KEYS.taskListCache, JSON.stringify(payload));
}

export function clearTaskListCache() {
  storageService.remove(STORAGE_KEYS.taskListCache);
}
