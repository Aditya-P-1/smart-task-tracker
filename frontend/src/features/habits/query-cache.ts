import { QueryClient } from '@tanstack/react-query';

import { saveHabitListCache } from './storage/habit-cache';
import type { HabitListItem } from './types/habit';
import { decorateHabit, sortHabits } from './utils/habit';

export const habitQueryKeys = {
  all: ['habits'] as const,
  list: (userId: string) => ['habits', userId] as const,
};

export function setCachedHabitQueryData(
  queryClient: QueryClient,
  userId: string,
  habits: HabitListItem[],
) {
  const sortedHabits = sortHabits(habits.map((habit) => decorateHabit(habit)));

  queryClient.setQueryData(habitQueryKeys.list(userId), sortedHabits);
  saveHabitListCache(userId, sortedHabits);
}

export function replaceHabit(habits: HabitListItem[], habitId: string, nextHabit: HabitListItem) {
  return habits.map((habit) => (habit.id === habitId ? nextHabit : habit));
}

export function removeHabit(habits: HabitListItem[], habitId: string) {
  return habits.filter((habit) => habit.id !== habitId);
}

export function upsertHabit(habits: HabitListItem[], nextHabit: HabitListItem) {
  const hasHabit = habits.some((habit) => habit.id === nextHabit.id);

  return hasHabit
    ? replaceHabit(habits, nextHabit.id, nextHabit)
    : [...habits, nextHabit];
}
