import axios from 'axios';

import { appQueryClient } from '../../providers/query-provider';
import { getStoredAuthUser } from '../../features/auth/storage/auth-session';
import { createHabit, deleteHabit, checkInHabit } from '../../features/habits/api/habits';
import { getCachedHabitList } from '../../features/habits/storage/habit-cache';
import { decorateHabit } from '../../features/habits/utils/habit';
import {
  invalidateHabitListQuery,
  habitQueryKeys,
  removeHabit,
  replaceHabit,
  setCachedHabitQueryData,
  upsertHabit,
} from '../../features/habits/query-cache';
import { createTask, deleteTask, updateTask } from '../../features/tasks/api/tasks';
import { getCachedTaskList } from '../../features/tasks/storage/task-cache';
import {
  invalidateTaskListQuery,
  removeTask,
  replaceTask,
  setCachedTaskQueryData,
  taskQueryKeys,
  upsertTask,
} from '../../features/tasks/query-cache';
import type { HabitListItem } from '../../features/habits/types/habit';
import type { TaskListItem } from '../../features/tasks/types/task';
import { isNetworkOnline } from '../network/network-service';
import { enqueueOfflineAction } from '../queue/action-queue';
import {
  clearOfflineQueueState,
  getOfflineQueueState,
  updateOfflineQueueState,
} from '../queue/queue-storage';
import type {
  OfflineAction,
  OfflineQueueState,
  ProcessQueueActionResult,
  QueueSubmissionResult,
} from '../types';

let isSyncInProgress = false;
let scheduledSyncTimeout: ReturnType<typeof setTimeout> | null = null;

type PendingInvalidations = {
  habits: boolean;
  tasks: boolean;
};

function getResolvedEntityId(state: OfflineQueueState, targetId: string) {
  return state.entityIdMap[targetId] ?? targetId;
}

function clearScheduledSync() {
  if (scheduledSyncTimeout) {
    clearTimeout(scheduledSyncTimeout);
    scheduledSyncTimeout = null;
  }
}

function scheduleOfflineSync(delayMs = 0) {
  clearScheduledSync();
  scheduledSyncTimeout = setTimeout(() => {
    scheduledSyncTimeout = null;
    void processOfflineQueue();
  }, delayMs);
}

function buildRetryDelayMs(attemptCount: number) {
  const exponentialDelay = Math.min(2 ** Math.max(attemptCount, 0) * 5_000, 5 * 60_000);
  return exponentialDelay;
}

function shouldRetryError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return true;
    }

    const statusCode = error.response.status;
    return statusCode === 429 || statusCode >= 500;
  }

  return false;
}

function removeActionById(actions: OfflineAction[], actionId: string) {
  return actions.filter((action) => action.id !== actionId);
}

function shouldInvalidateTasks(action: OfflineAction) {
  return action.type === 'CREATE_TASK' || action.type === 'UPDATE_TASK' || action.type === 'DELETE_TASK';
}

function shouldInvalidateHabits(action: OfflineAction) {
  return action.type === 'CREATE_HABIT' || action.type === 'DELETE_HABIT' || action.type === 'CHECKIN_HABIT';
}

function mergeLatestQueueState(
  latestState: OfflineQueueState,
  nextState: OfflineQueueState,
) {
  return pruneEntityIdMap({
    ...latestState,
    ...nextState,
    entityIdMap: {
      ...latestState.entityIdMap,
      ...nextState.entityIdMap,
    },
  });
}

function persistQueueStateUpdate(
  nextState: OfflineQueueState,
  updater: (latestState: OfflineQueueState) => OfflineQueueState,
) {
  return updateOfflineQueueState((latestState) => {
    const mergedState = mergeLatestQueueState(latestState, nextState);
    return updater(mergedState);
  });
}

function pruneEntityIdMap(state: OfflineQueueState): OfflineQueueState {
  const referencedTargetIds = new Set(state.actions.map((action) => action.targetId));
  const nextEntityIdMap = Object.fromEntries(
    Object.entries(state.entityIdMap).filter(([targetId]) => referencedTargetIds.has(targetId)),
  );

  if (Object.keys(nextEntityIdMap).length === Object.keys(state.entityIdMap).length) {
    return state;
  }

  return {
    ...state,
    entityIdMap: nextEntityIdMap,
  };
}

function getCachedTasksForUser(userId: string) {
  const queryTasks = appQueryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(userId));

  if (queryTasks) {
    return queryTasks;
  }

  return getCachedTaskList(userId)?.tasks ?? [];
}

function updateTaskCacheAfterCreate(userId: string, localId: string, serverTask: TaskListItem) {
  const currentTasks = getCachedTasksForUser(userId);
  setCachedTaskQueryData(
    appQueryClient,
    userId,
    currentTasks.some((task) => task.id === localId)
      ? currentTasks.map((task) => (task.id === localId ? serverTask : task))
      : upsertTask(currentTasks, serverTask),
  );
}

function updateTaskCacheAfterUpdate(userId: string, entityId: string, serverTask: TaskListItem) {
  const currentTasks = getCachedTasksForUser(userId);
  setCachedTaskQueryData(
    appQueryClient,
    userId,
    currentTasks.some((task) => task.id === entityId)
      ? replaceTask(currentTasks, entityId, serverTask)
      : upsertTask(currentTasks, serverTask),
  );
}

function removeTaskFromCache(userId: string, entityId: string, mappedEntityId?: string) {
  const currentTasks = getCachedTasksForUser(userId);
  let nextTasks = removeTask(currentTasks, entityId);

  if (mappedEntityId && mappedEntityId !== entityId) {
    nextTasks = removeTask(nextTasks, mappedEntityId);
  }

  setCachedTaskQueryData(appQueryClient, userId, nextTasks);
}

function getCachedHabitsForUser(userId: string) {
  const queryHabits = appQueryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(userId));

  if (queryHabits) {
    return queryHabits;
  }

  return getCachedHabitList(userId)?.habits.map((habit) => decorateHabit(habit)) ?? [];
}

function updateHabitCacheAfterCreate(userId: string, localId: string, serverHabit: HabitListItem) {
  const currentHabits = getCachedHabitsForUser(userId);
  setCachedHabitQueryData(
    appQueryClient,
    userId,
    currentHabits.some((habit) => habit.id === localId)
      ? currentHabits.map((habit) => (habit.id === localId ? serverHabit : habit))
      : upsertHabit(currentHabits, serverHabit),
  );
}

function updateHabitCacheAfterCheckIn(userId: string, entityId: string, serverHabit: HabitListItem) {
  const currentHabits = getCachedHabitsForUser(userId);
  setCachedHabitQueryData(
    appQueryClient,
    userId,
    currentHabits.some((habit) => habit.id === entityId)
      ? replaceHabit(currentHabits, entityId, serverHabit)
      : upsertHabit(currentHabits, serverHabit),
  );
}

function removeHabitFromCache(userId: string, entityId: string, mappedEntityId?: string) {
  const currentHabits = getCachedHabitsForUser(userId);
  let nextHabits = removeHabit(currentHabits, entityId);

  if (mappedEntityId && mappedEntityId !== entityId) {
    nextHabits = removeHabit(nextHabits, mappedEntityId);
  }

  setCachedHabitQueryData(appQueryClient, userId, nextHabits);
}

function clearHabitPendingState(userId: string, entityId: string) {
  const currentHabits = getCachedHabitsForUser(userId);
  const currentHabit = currentHabits.find((habit) => habit.id === entityId);

  if (!currentHabit) {
    return null;
  }

  const nextHabit = decorateHabit({
    ...currentHabit,
    isPending: false,
  });

  setCachedHabitQueryData(
    appQueryClient,
    userId,
    replaceHabit(currentHabits, entityId, nextHabit),
  );

  return nextHabit;
}

async function syncAction(
  action: OfflineAction,
  state: OfflineQueueState,
): Promise<ProcessQueueActionResult> {
  const resolvedEntityId = getResolvedEntityId(state, action.targetId);

  switch (action.type) {
    case 'CREATE_TASK': {
      const serverTask = await createTask(action.payload);
      state.entityIdMap[action.targetId] = serverTask.id;
      updateTaskCacheAfterCreate(action.userId, action.targetId, serverTask);
      return {
        status: 'synced',
        syncedEntity: serverTask,
      };
    }

    case 'UPDATE_TASK': {
      try {
        const serverTask = await updateTask(resolvedEntityId, action.payload);
        updateTaskCacheAfterUpdate(action.userId, resolvedEntityId, serverTask);
        return {
          status: 'synced',
          syncedEntity: serverTask,
        };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          removeTaskFromCache(action.userId, action.targetId, resolvedEntityId);
          return {
            status: 'discarded',
          };
        }

        throw error;
      }
    }

    case 'DELETE_TASK': {
      try {
        await deleteTask(resolvedEntityId);
      } catch (error) {
        if (!(axios.isAxiosError(error) && error.response?.status === 404)) {
          throw error;
        }
      }

      removeTaskFromCache(action.userId, action.targetId, resolvedEntityId);
      return {
        status: 'synced',
      };
    }

    case 'CREATE_HABIT': {
      const serverHabit = decorateHabit(await createHabit(action.payload));
      state.entityIdMap[action.targetId] = serverHabit.id;
      updateHabitCacheAfterCreate(action.userId, action.targetId, serverHabit);
      return {
        status: 'synced',
        syncedEntity: serverHabit,
      };
    }

    case 'DELETE_HABIT': {
      try {
        await deleteHabit(resolvedEntityId);
      } catch (error) {
        if (!(axios.isAxiosError(error) && error.response?.status === 404)) {
          throw error;
        }
      }

      removeHabitFromCache(action.userId, action.targetId, resolvedEntityId);
      return {
        status: 'synced',
      };
    }

    case 'CHECKIN_HABIT': {
      try {
        const serverHabit = decorateHabit(await checkInHabit(resolvedEntityId));
        updateHabitCacheAfterCheckIn(action.userId, resolvedEntityId, serverHabit);
        return {
          status: 'synced',
          syncedEntity: serverHabit,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 409) {
            const currentHabit = clearHabitPendingState(action.userId, resolvedEntityId);
            return {
              status: 'synced',
              syncedEntity: currentHabit ?? undefined,
            };
          }

          if (error.response?.status === 404) {
            removeHabitFromCache(action.userId, action.targetId, resolvedEntityId);
            return {
              status: 'discarded',
            };
          }
        }

        throw error;
      }
    }

    default: {
      return {
        status: 'discarded',
      };
    }
  }
}

async function processQueuedAction(
  action: OfflineAction,
  state: OfflineQueueState,
): Promise<ProcessQueueActionResult> {
  try {
    return await syncAction(action, state);
  } catch (error) {
    if (shouldRetryError(error)) {
      return {
        status: 'retry',
      };
    }

    if (action.type === 'CREATE_TASK') {
      removeTaskFromCache(action.userId, action.targetId);
    }

    if (action.type === 'CREATE_HABIT') {
      removeHabitFromCache(action.userId, action.targetId);
    }

    return {
      status: 'discarded',
      error,
    };
  }
}

function getActionResultDelayMs(state: OfflineQueueState) {
  const retryTimestamps = state.actions
    .map((action) => (action.nextRetryAt ? new Date(action.nextRetryAt).getTime() : Number.NaN))
    .filter((timestamp) => !Number.isNaN(timestamp))
    .sort((left, right) => left - right);

  if (retryTimestamps.length === 0) {
    return null;
  }

  return Math.max(retryTimestamps[0] - Date.now(), 0);
}

function hasReadyAction(state: OfflineQueueState, currentUserId: string) {
  return state.actions.some((action) => {
    if (action.userId !== currentUserId) {
      return false;
    }

    if (!action.nextRetryAt) {
      return true;
    }

    return new Date(action.nextRetryAt).getTime() <= Date.now();
  });
}

async function flushPendingInvalidations(userId: string, pendingInvalidations: PendingInvalidations) {
  await Promise.allSettled([
    pendingInvalidations.tasks ? invalidateTaskListQuery(appQueryClient, userId) : Promise.resolve(),
    pendingInvalidations.habits ? invalidateHabitListQuery(appQueryClient, userId) : Promise.resolve(),
  ]);
}

export async function processOfflineQueue() {
  if (isSyncInProgress || !isNetworkOnline()) {
    return new Map<string, ProcessQueueActionResult>();
  }

  isSyncInProgress = true;
  clearScheduledSync();

  const results = new Map<string, ProcessQueueActionResult>();

  try {
    let state = pruneEntityIdMap(getOfflineQueueState());
    const currentUser = getStoredAuthUser();
    const pendingInvalidations: PendingInvalidations = {
      habits: false,
      tasks: false,
    };

    if (!currentUser?.id || state.actions.length === 0) {
      return results;
    }

    let nextActions = [...state.actions];

    for (const action of state.actions) {
      if (action.userId !== currentUser.id) {
        nextActions = removeActionById(nextActions, action.id);
        state = persistQueueStateUpdate(
          {
            ...state,
            actions: nextActions,
          },
          (latestState) => ({
            ...latestState,
            actions: removeActionById(latestState.actions, action.id),
          }),
        );
        continue;
      }

      if (action.nextRetryAt && new Date(action.nextRetryAt).getTime() > Date.now()) {
        continue;
      }

      const actionResult = await processQueuedAction(action, {
        ...state,
        actions: nextActions,
      });

      results.set(action.id, actionResult);

      if (actionResult.status === 'synced' || actionResult.status === 'discarded') {
        nextActions = removeActionById(nextActions, action.id);
        state = persistQueueStateUpdate(
          {
            ...state,
            actions: nextActions,
          },
          (latestState) => ({
            ...latestState,
            actions: removeActionById(latestState.actions, action.id),
          }),
        );

        if (shouldInvalidateTasks(action)) {
          pendingInvalidations.tasks = true;
        }

        if (shouldInvalidateHabits(action)) {
          pendingInvalidations.habits = true;
        }

        continue;
      }

      if (actionResult.status === 'retry') {
        nextActions = nextActions.map((queuedAction) =>
          queuedAction.id === action.id
            ? {
                ...queuedAction,
                attemptCount: queuedAction.attemptCount + 1,
                lastErrorMessage: 'Retry scheduled after a failed sync attempt.',
                nextRetryAt: new Date(
                  Date.now() + buildRetryDelayMs(queuedAction.attemptCount + 1),
                ).toISOString(),
              }
            : queuedAction,
        );

        state = persistQueueStateUpdate(
          {
            ...state,
            actions: nextActions,
          },
          (latestState) => ({
            ...latestState,
            actions: latestState.actions.map((queuedAction) =>
              queuedAction.id === action.id
                ? {
                    ...queuedAction,
                    attemptCount: queuedAction.attemptCount + 1,
                    lastErrorMessage: 'Retry scheduled after a failed sync attempt.',
                    nextRetryAt: new Date(
                      Date.now() + buildRetryDelayMs(queuedAction.attemptCount + 1),
                    ).toISOString(),
                  }
                : queuedAction,
            ),
          }),
        );
        break;
      }
    }

    const latestState = pruneEntityIdMap(getOfflineQueueState());

    if (latestState.actions.length === 0) {
      clearOfflineQueueState();
    } else {
      if (hasReadyAction(latestState, currentUser.id)) {
        scheduleOfflineSync(0);
      } else {
        const nextDelayMs = getActionResultDelayMs(latestState);

        if (typeof nextDelayMs === 'number') {
          scheduleOfflineSync(nextDelayMs);
        }
      }
    }

    await flushPendingInvalidations(currentUser.id, pendingInvalidations);

    return results;
  } finally {
    isSyncInProgress = false;
  }
}

export async function enqueueAndSyncAction<TEntity>(action: OfflineAction): Promise<QueueSubmissionResult<TEntity>> {
  const enqueueResult = enqueueOfflineAction(action);

  if (enqueueResult.status === 'discarded' || !enqueueResult.resolvedActionId) {
    return {
      status: 'discarded',
    };
  }

  if (!isNetworkOnline()) {
    return {
      status: 'queued',
    };
  }

  const results = await processOfflineQueue();
  const actionResult = results.get(enqueueResult.resolvedActionId);

  if (actionResult?.status === 'synced') {
    return {
      status: 'synced',
      syncedEntity: actionResult.syncedEntity as TEntity | undefined,
    };
  }

  if (actionResult?.status === 'discarded' && actionResult.error) {
    throw actionResult.error;
  }

  return {
    status: 'queued',
  };
}

export function scheduleQueuedSync(delayMs = 0) {
  scheduleOfflineSync(delayMs);
}
