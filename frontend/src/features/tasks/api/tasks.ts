import { apiClient } from '../../../api/client';
import type { ApiResponse } from '../../../types/api';

import type { CreateTaskPayload, Task, UpdateTaskPayload } from '../types/task';

type FetchTasksOptions = {
  signal?: AbortSignal;
};

export async function fetchTasks(options: FetchTasksOptions = {}) {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks', {
    signal: options.signal,
  });
  return response.data.data;
}

export async function createTask(payload: CreateTaskPayload) {
  const response = await apiClient.post<ApiResponse<Task>>('/tasks', payload);
  return response.data.data;
}

export async function updateTask(taskId: string, payload: UpdateTaskPayload) {
  const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${taskId}`, payload);
  return response.data.data;
}

export async function deleteTask(taskId: string) {
  const response = await apiClient.delete<ApiResponse<Task>>(`/tasks/${taskId}`);
  return response.data.data;
}
