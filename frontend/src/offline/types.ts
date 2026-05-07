import type { CreateHabitPayload } from '../features/habits/types/habit';
import type { CreateTaskPayload, UpdateTaskPayload } from '../features/tasks/types/task';

type OfflineActionBase = {
  attemptCount: number;
  createdAt: string;
  id: string;
  lastErrorMessage?: string;
  nextRetryAt?: string;
  targetId: string;
  type:
    | 'CHECKIN_HABIT'
    | 'CREATE_HABIT'
    | 'CREATE_TASK'
    | 'DELETE_HABIT'
    | 'DELETE_TASK'
    | 'UPDATE_TASK';
  userId: string;
};

export type CreateTaskOfflineAction = OfflineActionBase & {
  payload: CreateTaskPayload;
  type: 'CREATE_TASK';
};

export type UpdateTaskOfflineAction = OfflineActionBase & {
  payload: UpdateTaskPayload;
  type: 'UPDATE_TASK';
};

export type DeleteTaskOfflineAction = OfflineActionBase & {
  type: 'DELETE_TASK';
};

export type CreateHabitOfflineAction = OfflineActionBase & {
  payload: CreateHabitPayload;
  type: 'CREATE_HABIT';
};

export type DeleteHabitOfflineAction = OfflineActionBase & {
  type: 'DELETE_HABIT';
};

export type CheckInHabitOfflineAction = OfflineActionBase & {
  dayKey: string;
  type: 'CHECKIN_HABIT';
};

export type OfflineAction =
  | CheckInHabitOfflineAction
  | CreateHabitOfflineAction
  | CreateTaskOfflineAction
  | DeleteHabitOfflineAction
  | DeleteTaskOfflineAction
  | UpdateTaskOfflineAction;

export type OfflineQueueState = {
  actions: OfflineAction[];
  entityIdMap: Record<string, string>;
  updatedAt: string;
};

export type EnqueueOfflineActionResult = {
  resolvedActionId: string | null;
  status: 'discarded' | 'enqueued' | 'merged';
};

export type QueueSubmissionResult<TEntity> =
  | {
      status: 'discarded' | 'queued';
      syncedEntity?: undefined;
    }
  | {
      status: 'synced';
      syncedEntity?: TEntity;
    };

export type ProcessQueueActionResult<TEntity = unknown> =
  | {
      status: 'discarded';
      error?: unknown;
    }
  | {
      status: 'queued';
    }
  | {
      status: 'retry';
    }
  | {
      status: 'synced';
      syncedEntity?: TEntity;
    };
