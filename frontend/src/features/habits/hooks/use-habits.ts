import { useEffect } from 'react';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getStoredAuthUser } from '../../auth/storage/auth-session';
import { checkInHabit, createHabit, deleteHabit, fetchHabits } from '../api/habits';
import { getCachedHabitList, saveHabitListCache } from '../storage/habit-cache';
import type {
  CheckInHabitInput,
  CreateHabitPayload,
  DeleteHabitInput,
  Habit,
  HabitListItem,
  RestoreDeletedHabitContext,
  RestoreHabitContext,
} from '../types/habit';
import {
  buildOptimisticHabitCheckIn,
  createOptimisticHabit,
  decorateHabit,
  sortHabits,
} from '../utils/habit';

type CreateHabitMutationContext = {
  optimisticHabitId: string;
  userId: string;
};

export const habitQueryKeys = {
  all: ['habits'] as const,
  list: (userId: string) => ['habits', userId] as const,
};

function setCachedHabitQueryData(
  queryClient: QueryClient,
  userId: string,
  habits: HabitListItem[],
) {
  const sortedHabits = sortHabits(habits.map((habit) => decorateHabit(habit)));

  queryClient.setQueryData(habitQueryKeys.list(userId), sortedHabits);
  saveHabitListCache(userId, sortedHabits);
}

function replaceHabit(habits: HabitListItem[], habitId: string, nextHabit: HabitListItem) {
  return habits.map((habit) => (habit.id === habitId ? nextHabit : habit));
}

function removeHabit(habits: HabitListItem[], habitId: string) {
  return habits.filter((habit) => habit.id !== habitId);
}

function upsertHabit(habits: HabitListItem[], nextHabit: HabitListItem) {
  const hasHabit = habits.some((habit) => habit.id === nextHabit.id);

  return hasHabit
    ? replaceHabit(habits, nextHabit.id, nextHabit)
    : [...habits, nextHabit];
}

function resolveActiveUserId() {
  const currentUser = getStoredAuthUser();

  if (!currentUser?.id) {
    throw new Error('You must be logged in to manage habits.');
  }

  return currentUser.id;
}

export function useHabits() {
  const currentUser = getStoredAuthUser();
  const userId = currentUser?.id;
  const cachedHabits = userId ? getCachedHabitList(userId) : null;

  const query = useQuery({
    enabled: Boolean(userId),
    initialData: cachedHabits?.habits,
    initialDataUpdatedAt: cachedHabits ? new Date(cachedHabits.updatedAt).getTime() : undefined,
    queryFn: fetchHabits,
    queryKey: userId ? habitQueryKeys.list(userId) : habitQueryKeys.all,
    select: (habits) => sortHabits(habits.map((habit) => decorateHabit(habit))),
  });

  useEffect(() => {
    if (userId && query.data) {
      saveHabitListCache(userId, query.data);
    }
  }, [query.data, userId]);

  return {
    ...query,
    habits: query.data ?? [],
    userId: userId ?? null,
  };
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation<Habit, Error, CreateHabitPayload, CreateHabitMutationContext>({
    mutationFn: createHabit,
    onError: (_error, _payload, context) => {
      if (!context) {
        return;
      }

      const currentHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(context.userId)) ?? [];

      setCachedHabitQueryData(
        queryClient,
        context.userId,
        removeHabit(currentHabits, context.optimisticHabitId),
      );
    },
    onMutate: async (payload) => {
      const userId = resolveActiveUserId();

      await queryClient.cancelQueries({ queryKey: habitQueryKeys.list(userId) });

      const previousHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(userId)) ?? [];
      const optimisticHabit = createOptimisticHabit(payload, userId);

      setCachedHabitQueryData(queryClient, userId, [optimisticHabit, ...previousHabits]);

      return {
        optimisticHabitId: optimisticHabit.id,
        userId,
      };
    },
    onSettled: async (_data, _error, _payload, context) => {
      if (context) {
        await queryClient.invalidateQueries({ queryKey: habitQueryKeys.list(context.userId) });
      }
    },
    onSuccess: (createdHabit, _payload, context) => {
      if (!context) {
        return;
      }

      const currentHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(context.userId)) ?? [];

      setCachedHabitQueryData(
        queryClient,
        context.userId,
        currentHabits.map((habit) =>
          habit.id === context.optimisticHabitId ? decorateHabit(createdHabit) : habit,
        ),
      );
    },
  });
}

export function useCheckInHabit() {
  const queryClient = useQueryClient();

  return useMutation<Habit, Error, CheckInHabitInput, RestoreHabitContext | null>({
    mutationFn: ({ habitId }) => checkInHabit(habitId),
    onError: (_error, _payload, context) => {
      if (!context) {
        return;
      }

      const currentHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(context.userId)) ?? [];

      setCachedHabitQueryData(
        queryClient,
        context.userId,
        currentHabits.map((habit) =>
          habit.id === context.previousHabit.id ? decorateHabit(context.previousHabit) : habit,
        ),
      );
    },
    onMutate: async ({ habitId }) => {
      const userId = resolveActiveUserId();

      await queryClient.cancelQueries({ queryKey: habitQueryKeys.list(userId) });

      const previousHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(userId)) ?? [];
      const previousHabit = previousHabits.find((habit) => habit.id === habitId);

      if (!previousHabit) {
        return null;
      }

      setCachedHabitQueryData(
        queryClient,
        userId,
        previousHabits.map((habit) =>
          habit.id === habitId ? buildOptimisticHabitCheckIn(habit) : habit,
        ),
      );

      return {
        previousHabit,
        userId,
      };
    },
    onSettled: async (_data, _error, _payload, context) => {
      if (context) {
        await queryClient.invalidateQueries({ queryKey: habitQueryKeys.list(context.userId) });
      }
    },
    onSuccess: (checkedInHabit, variables, context) => {
      if (!context) {
        return;
      }

      const currentHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(context.userId)) ?? [];

      setCachedHabitQueryData(
        queryClient,
        context.userId,
        replaceHabit(currentHabits, variables.habitId, decorateHabit(checkedInHabit)),
      );
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation<Habit, Error, DeleteHabitInput, RestoreDeletedHabitContext | null>({
    mutationFn: ({ habitId }) => deleteHabit(habitId),
    onError: (_error, _payload, context) => {
      if (!context) {
        return;
      }

      const currentHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(context.userId)) ?? [];

      setCachedHabitQueryData(
        queryClient,
        context.userId,
        upsertHabit(currentHabits, decorateHabit(context.deletedHabit)),
      );
    },
    onMutate: async ({ habitId }) => {
      const userId = resolveActiveUserId();

      await queryClient.cancelQueries({ queryKey: habitQueryKeys.list(userId) });

      const previousHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(userId)) ?? [];
      const deletedHabit = previousHabits.find((habit) => habit.id === habitId);

      setCachedHabitQueryData(queryClient, userId, removeHabit(previousHabits, habitId));

      if (!deletedHabit) {
        return null;
      }

      return {
        deletedHabit,
        userId,
      };
    },
    onSettled: async (_data, _error, _payload, context) => {
      if (context) {
        await queryClient.invalidateQueries({ queryKey: habitQueryKeys.list(context.userId) });
      }
    },
  });
}
