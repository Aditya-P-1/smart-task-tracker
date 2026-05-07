import { QueryClient } from '@tanstack/react-query';

import { saveTaskListCache } from './storage/task-cache';
import type { CreateTaskPayload, TaskListItem, UpdateTaskPayload } from './types/task';

export const taskQueryKeys = {
  all: ['tasks'] as const,
  list: (userId: string) => ['tasks', userId] as const,
};

export function compareTasks(left: TaskListItem, right: TaskListItem) {
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

export function sortTasks(tasks: TaskListItem[]) {
  return [...tasks].sort(compareTasks);
}

export function setCachedTaskQueryData(
  queryClient: QueryClient,
  userId: string,
  tasks: TaskListItem[],
) {
  const sortedTasks = sortTasks(tasks);

  queryClient.setQueryData(taskQueryKeys.list(userId), sortedTasks);
  saveTaskListCache(userId, sortedTasks);
}

export function replaceTask(tasks: TaskListItem[], taskId: string, nextTask: TaskListItem) {
  return tasks.map((task) => (task.id === taskId ? nextTask : task));
}

export function removeTask(tasks: TaskListItem[], taskId: string) {
  return tasks.filter((task) => task.id !== taskId);
}

export function upsertTask(tasks: TaskListItem[], nextTask: TaskListItem) {
  const hasTask = tasks.some((task) => task.id === nextTask.id);

  return hasTask ? replaceTask(tasks, nextTask.id, nextTask) : [...tasks, nextTask];
}

export function createOptimisticTaskId() {
  return `temp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function buildOptimisticTask(
  payload: CreateTaskPayload,
  userId: string,
  taskId = createOptimisticTaskId(),
): TaskListItem {
  const timestamp = new Date().toISOString();

  return {
    completed: payload.completed ?? false,
    createdAt: timestamp,
    description: payload.description ?? '',
    dueDate: payload.dueDate ?? null,
    id: taskId,
    isPending: true,
    title: payload.title,
    updatedAt: timestamp,
    userId,
  };
}

export function buildOptimisticTaskUpdate(task: TaskListItem, values: UpdateTaskPayload): TaskListItem {
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
