import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getStoredAuthUser } from '../../auth/storage/auth-session';
import { createOfflineAction } from '../../../offline/queue/action-queue';
import { enqueueAndSyncAction } from '../../../offline/sync/offline-sync-service';
import type { QueueSubmissionResult } from '../../../offline/types';
import { fetchTasks } from '../api/tasks';
import {
  buildOptimisticTask,
  buildOptimisticTaskUpdate,
  createOptimisticTaskId,
  removeTask,
  replaceTask,
  setCachedTaskQueryData,
  taskQueryKeys,
  upsertTask,
} from '../query-cache';
import { getCachedTaskList, saveTaskListCache } from '../storage/task-cache';
import type {
  CreateTaskPayload,
  DeleteTaskInput,
  RestoreDeletedTaskContext,
  Task,
  TaskListItem,
  UpdateTaskInput,
} from '../types/task';

type UpdateTaskMutationContext = {
  previousTask: TaskListItem | null;
  userId: string;
};

type CreateTaskMutationContext = {
  optimisticTaskId: string;
  userId: string;
};

type CreateTaskMutationVariables = {
  clientTaskId: string;
  payload: CreateTaskPayload;
  userId: string;
};

function resolveActiveUserId() {
  const currentUser = getStoredAuthUser();

  if (!currentUser?.id) {
    throw new Error('You must be logged in to manage tasks.');
  }

  return currentUser.id;
}

export function useTasks() {
  const currentUser = getStoredAuthUser();
  const userId = currentUser?.id;
  const cachedTasks = userId ? getCachedTaskList(userId) : null;

  const query = useQuery({
    enabled: Boolean(userId),
    initialData: cachedTasks?.tasks,
    initialDataUpdatedAt: cachedTasks ? new Date(cachedTasks.updatedAt).getTime() : undefined,
    queryFn: fetchTasks,
    queryKey: userId ? taskQueryKeys.list(userId) : taskQueryKeys.all,
  });

  useEffect(() => {
    if (userId && query.data) {
      saveTaskListCache(userId, query.data);
    }
  }, [query.data, userId]);

  return {
    ...query,
    tasks: query.data ?? [],
    userId: userId ?? null,
  };
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    QueueSubmissionResult<Task>,
    Error,
    CreateTaskMutationVariables,
    CreateTaskMutationContext
  >({
    mutationFn: ({ clientTaskId, payload, userId }) =>
      enqueueAndSyncAction<Task>(
        createOfflineAction({
          payload,
          targetId: clientTaskId,
          type: 'CREATE_TASK',
          userId,
        }),
      ),
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      const currentTasks =
        queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

      setCachedTaskQueryData(
        queryClient,
        context.userId,
        removeTask(currentTasks, context.optimisticTaskId),
      );
    },
    onMutate: async ({ clientTaskId, payload, userId }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.list(userId) });

      const previousTasks = queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(userId)) ?? [];
      const optimisticTask = buildOptimisticTask(payload, userId, clientTaskId);

      setCachedTaskQueryData(queryClient, userId, [optimisticTask, ...previousTasks]);

      return {
        optimisticTaskId: optimisticTask.id,
        userId,
      };
    },
    onSuccess: (result, _variables, context) => {
      if (!context || result.status !== 'synced' || !result.syncedEntity) {
        return;
      }

      const syncedTask = result.syncedEntity;

      const currentTasks =
        queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

      setCachedTaskQueryData(
        queryClient,
        context.userId,
        currentTasks.map((task) =>
          task.id === context.optimisticTaskId ? syncedTask : task,
        ),
      );
    },
  });

  function buildVariables(payload: CreateTaskPayload): CreateTaskMutationVariables {
    return {
      clientTaskId: createOptimisticTaskId(),
      payload,
      userId: resolveActiveUserId(),
    };
  }

  return {
    ...mutation,
    mutate: (payload: CreateTaskPayload) => {
      mutation.mutate(buildVariables(payload));
    },
    mutateAsync: (payload: CreateTaskPayload) => mutation.mutateAsync(buildVariables(payload)),
    variables: mutation.variables?.payload,
  };
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<QueueSubmissionResult<Task>, Error, UpdateTaskInput, UpdateTaskMutationContext>({
    mutationFn: ({ taskId, values }) =>
      enqueueAndSyncAction<Task>(
        createOfflineAction({
          payload: values,
          targetId: taskId,
          type: 'UPDATE_TASK',
          userId: resolveActiveUserId(),
        }),
      ),
    onError: (_error, _payload, context) => {
      if (!context?.previousTask) {
        return;
      }

      const currentTasks =
        queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

      setCachedTaskQueryData(
        queryClient,
        context.userId,
        upsertTask(currentTasks, context.previousTask),
      );
    },
    onMutate: async ({ taskId, values }) => {
      const userId = resolveActiveUserId();

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.list(userId) });

      const previousTasks = queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(userId)) ?? [];
      const previousTask = previousTasks.find((task) => task.id === taskId) ?? null;

      if (!previousTask) {
        return {
          previousTask: null,
          userId,
        };
      }

      setCachedTaskQueryData(
        queryClient,
        userId,
        previousTasks.map((task) =>
          task.id === taskId ? buildOptimisticTaskUpdate(task, values) : task,
        ),
      );

      return {
        previousTask,
        userId,
      };
    },
    onSuccess: (result, variables, context) => {
      if (!context || result.status !== 'synced' || !result.syncedEntity) {
        return;
      }

      const syncedTask = result.syncedEntity;

      const currentTasks =
        queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

      setCachedTaskQueryData(
        queryClient,
        context.userId,
        replaceTask(currentTasks, variables.taskId, syncedTask),
      );
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<
    QueueSubmissionResult<never>,
    Error,
    DeleteTaskInput,
    RestoreDeletedTaskContext | null
  >({
    mutationFn: ({ taskId }) =>
      enqueueAndSyncAction(
        createOfflineAction({
          targetId: taskId,
          type: 'DELETE_TASK',
          userId: resolveActiveUserId(),
        }),
      ),
    onError: (_error, _payload, context) => {
      if (!context) {
        return;
      }

      const currentTasks =
        queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

      setCachedTaskQueryData(
        queryClient,
        context.userId,
        upsertTask(currentTasks, context.deletedTask),
      );
    },
    onMutate: async ({ taskId }) => {
      const userId = resolveActiveUserId();

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.list(userId) });

      const previousTasks = queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(userId)) ?? [];
      const deletedTask = previousTasks.find((task) => task.id === taskId);

      setCachedTaskQueryData(queryClient, userId, removeTask(previousTasks, taskId));

      if (!deletedTask) {
        return null;
      }

      return {
        deletedTask,
        userId,
      };
    },
  });
}
