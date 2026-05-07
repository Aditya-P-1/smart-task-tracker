import { STORAGE_KEYS } from '../../../constants/storage-keys';
import { storageService } from '../../../storage/mmkv';

import type { CachedTaskList, TaskListItem } from '../types/task';

let cachedTaskList: CachedTaskList | null = null;
let cachedTaskSnapshot: string | null = null;

function serializeTasks(tasks: TaskListItem[]) {
  return tasks.map(({ isPending: _isPending, ...task }) => task);
}

function buildTaskCacheSnapshot(userId: string, tasks: TaskListItem[]) {
  return JSON.stringify({
    tasks: serializeTasks(tasks),
    userId,
  });
}

function rememberTaskCache(cache: CachedTaskList) {
  cachedTaskList = cache;
  cachedTaskSnapshot = buildTaskCacheSnapshot(cache.userId, cache.tasks);
}

export function getCachedTaskList(userId: string) {
  if (cachedTaskList?.userId === userId) {
    return cachedTaskList;
  }

  const rawCache = storageService.getString(STORAGE_KEYS.taskListCache);

  if (!rawCache) {
    cachedTaskList = null;
    cachedTaskSnapshot = null;
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
      cachedTaskList = null;
      cachedTaskSnapshot = null;
      return null;
    }

    rememberTaskCache(parsedCache);
    return parsedCache;
  } catch {
    clearTaskListCache();
    return null;
  }
}

export function createTaskCacheSnapshot(userId: string, tasks: TaskListItem[]) {
  return buildTaskCacheSnapshot(userId, tasks);
}

export function saveTaskListCache(userId: string, tasks: TaskListItem[]) {
  const serializedTasks = serializeTasks(tasks);
  const nextSnapshot = JSON.stringify({
    tasks: serializedTasks,
    userId,
  });

  if (cachedTaskSnapshot === nextSnapshot) {
    return;
  }

  const payload: CachedTaskList = {
    tasks: serializedTasks,
    updatedAt: new Date().toISOString(),
    userId,
  };

  rememberTaskCache(payload);
  storageService.set(STORAGE_KEYS.taskListCache, JSON.stringify(payload));
}

export function clearTaskListCache() {
  cachedTaskList = null;
  cachedTaskSnapshot = null;
  storageService.remove(STORAGE_KEYS.taskListCache);
}
