import { apiClient } from '../../../api/client';
import type { ApiResponse } from '../../../types/api';

import type { CreateHabitPayload, Habit } from '../types/habit';

export async function fetchHabits() {
  const response = await apiClient.get<ApiResponse<Habit[]>>('/habits');
  return response.data.data;
}

export async function createHabit(payload: CreateHabitPayload) {
  const response = await apiClient.post<ApiResponse<Habit>>('/habits', payload);
  return response.data.data;
}

export async function checkInHabit(habitId: string) {
  const response = await apiClient.post<ApiResponse<Habit>>(`/habits/${habitId}/check-in`);
  return response.data.data;
}

export async function deleteHabit(habitId: string) {
  const response = await apiClient.delete<ApiResponse<Habit>>(`/habits/${habitId}`);
  return response.data.data;
}
