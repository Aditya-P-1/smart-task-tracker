import { useEffect } from 'react';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getStoredAuthUser } from '../../auth/storage/auth-session';
import { createTask, deleteTask, fetchTasks, updateTask } from '../api/tasks';
import { getCachedTaskList, saveTaskListCache } from '../storage/task-cache';
import type {
  CreateTaskPayload,
  DeleteTaskInput,
  RestoreDeletedTaskContext,
  Task,
  TaskListItem,
  UpdateTaskInput,
  UpdateTaskPayload,
} from '../types/task';

type UpdateTaskMutationContext = {
  previousTask: TaskListItem | null;
  userId: string;
};

type CreateTaskMutationContext = {
  optimisticTaskId: string;
  userId: string;
};

export const taskQueryKeys = {
  all: ['tasks'] as const,
  list: (userId: string) => ['tasks', userId] as const,
};

function compareTasks(left: TaskListItem, right: TaskListItem) {
  if (left.completed !== right.completed) {
    return left.completed ? 1 : -1;
  }

  if (left.dueDate && right.dueDate) {
    const dueDateDifference = new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();

    if (dueDateDifference !== 0) {
      return dueDateDifference;
    }
  } else if (left.dueDate) {
    return -1;
  } else if (right.dueDate) {
    return 1;
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function sortTasks(tasks: TaskListItem[]) {
  return [...tasks].sort(compareTasks);
}

function setCachedTaskQueryData(
  queryClient: QueryClient,
  userId: string,
  tasks: TaskListItem[],
) {
  const sortedTasks = sortTasks(tasks);

  queryClient.setQueryData(taskQueryKeys.list(userId), sortedTasks);
  saveTaskListCache(userId, sortedTasks);
}

function replaceTask(tasks: TaskListItem[], taskId: string, nextTask: TaskListItem) {
  return tasks.map((task) => (task.id === taskId ? nextTask : task));
}

function removeTask(tasks: TaskListItem[], taskId: string) {
  return tasks.filter((task) => task.id !== taskId);
}

function upsertTask(tasks: TaskListItem[], nextTask: TaskListItem) {
  const hasTask = tasks.some((task) => task.id === nextTask.id);

  return hasTask ? replaceTask(tasks, nextTask.id, nextTask) : [...tasks, nextTask];
}

function createOptimisticTaskId() {
  return `temp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function buildOptimisticTask(payload: CreateTaskPayload, userId: string): TaskListItem {
  const timestamp = new Date().toISOString();

  return {
    completed: payload.completed ?? false,
    createdAt: timestamp,
    description: payload.description ?? '',
    dueDate: payload.dueDate ?? null,
    id: createOptimisticTaskId(),
    isPending: true,
    title: payload.title,
    updatedAt: timestamp,
    userId,
  };
}

function buildOptimisticTaskUpdate(task: TaskListItem, values: UpdateTaskPayload): TaskListItem {
  return {
    ...task,
    completed: values.completed ?? task.completed,
    description: values.description ?? task.description,
    dueDate: typeof values.dueDate === 'undefined' ? task.dueDate : values.dueDate,
    isPending: true,
    title: values.title ?? task.title,
    updatedAt: new Date().toISOString(),
  };
}

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

  return useMutation<Task, Error, CreateTaskPayload, CreateTaskMutationContext>({
    mutationFn: createTask,
    onError: (_error, _payload, context) => {
      if (context) {
        const currentTasks =
          queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

        setCachedTaskQueryData(
          queryClient,
          context.userId,
          removeTask(currentTasks, context.optimisticTaskId),
        );
      }
    },
    onMutate: async (payload) => {
      const userId = resolveActiveUserId();

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.list(userId) });

      const previousTasks = queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(userId)) ?? [];
      const optimisticTask = buildOptimisticTask(payload, userId);

      setCachedTaskQueryData(queryClient, userId, [optimisticTask, ...previousTasks]);

      return {
        optimisticTaskId: optimisticTask.id,
        userId,
      };
    },
    onSettled: async (_data, _error, _payload, context) => {
      if (context) {
        await queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(context.userId) });
      }
    },
    onSuccess: (createdTask, _payload, context) => {
      if (!context) {
        return;
      }

      const currentTasks =
        queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

      setCachedTaskQueryData(
        queryClient,
        context.userId,
        currentTasks.map((task) => (task.id === context.optimisticTaskId ? createdTask : task)),
      );
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, UpdateTaskInput, UpdateTaskMutationContext>({
    mutationFn: ({ taskId, values }) => updateTask(taskId, values),
    onError: (_error, _payload, context) => {
      if (context?.previousTask) {
        const currentTasks =
          queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

        setCachedTaskQueryData(
          queryClient,
          context.userId,
          upsertTask(currentTasks, context.previousTask),
        );
      }
    },
    onMutate: async ({ taskId, values }) => {
      const userId = resolveActiveUserId();

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.list(userId) });

      const previousTasks = queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(userId)) ?? [];
      const previousTask = previousTasks.find((task) => task.id === taskId) ?? null;
      const optimisticTasks = previousTasks.map((task) =>
        task.id === taskId ? buildOptimisticTaskUpdate(task, values) : task,
      );

      setCachedTaskQueryData(queryClient, userId, optimisticTasks);

      return {
        previousTask,
        userId,
      };
    },
    onSettled: async (_data, _error, _payload, context) => {
      if (context) {
        await queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(context.userId) });
      }
    },
    onSuccess: (updatedTask, variables, context) => {
      if (!context) {
        return;
      }

      const currentTasks =
        queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

      setCachedTaskQueryData(
        queryClient,
        context.userId,
        replaceTask(currentTasks, variables.taskId, updatedTask),
      );
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, DeleteTaskInput, RestoreDeletedTaskContext | null>({
    mutationFn: ({ taskId }) => deleteTask(taskId),
    onError: (_error, _payload, context) => {
      if (context) {
        const currentTasks =
          queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(context.userId)) ?? [];

        setCachedTaskQueryData(
          queryClient,
          context.userId,
          upsertTask(currentTasks, context.deletedTask),
        );
      }
    },
    onMutate: async ({ taskId }) => {
      const userId = resolveActiveUserId();

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.list(userId) });

      const previousTasks = queryClient.getQueryData<TaskListItem[]>(taskQueryKeys.list(userId)) ?? [];
      const deletedTask = previousTasks.find((task) => task.id === taskId);

      setCachedTaskQueryData(
        queryClient,
        userId,
        removeTask(previousTasks, taskId),
      );

      if (!deletedTask) {
        return null;
      }

      return {
        deletedTask,
        userId,
      };
    },
    onSettled: async (_data, _error, _payload, context) => {
      if (context) {
        await queryClient.invalidateQueries({ queryKey: taskQueryKeys.list(context.userId) });
      }
    },
  });
}
