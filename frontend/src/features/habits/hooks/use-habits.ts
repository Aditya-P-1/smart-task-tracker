import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getStoredAuthUser } from '../../auth/storage/auth-session';
import { createOfflineAction } from '../../../offline/queue/action-queue';
import { applyQueuedHabitActions } from '../../../offline/queue/query-overlays';
import { enqueueAndSyncAction } from '../../../offline/sync/offline-sync-service';
import type { QueueSubmissionResult } from '../../../offline/types';
import { usePersistedQueryData } from '../../../query/use-persisted-query-data';
import { fetchHabits } from '../api/habits';
import {
  habitQueryKeys,
  removeHabit,
  replaceHabit,
  setCachedHabitQueryData,
  upsertHabit,
} from '../query-cache';
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
  getHabitDayKey,
  sortHabits,
} from '../utils/habit';

type CreateHabitMutationContext = {
  optimisticHabitId: string;
  userId: string;
};

type CreateHabitMutationVariables = {
  clientHabitId: string;
  payload: CreateHabitPayload;
  userId: string;
};

function createOptimisticHabitId() {
  return `temp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
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
    refetchInterval: userId ? 60_000 : false,
    refetchIntervalInBackground: false,
    select: (habits) => {
      const offlineAwareHabits = userId ? applyQueuedHabitActions(habits, userId) : habits;
      return sortHabits(offlineAwareHabits.map((habit) => decorateHabit(habit)));
    },
  });

  usePersistedQueryData(userId ?? null, query.data, saveHabitListCache);

  return {
    ...query,
    habits: query.data ?? [],
    userId: userId ?? null,
  };
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    QueueSubmissionResult<Habit>,
    Error,
    CreateHabitMutationVariables,
    CreateHabitMutationContext
  >({
    mutationKey: ['habits', 'create'],
    mutationFn: ({ clientHabitId, payload, userId }) =>
      enqueueAndSyncAction<Habit>(
        createOfflineAction({
          payload,
          targetId: clientHabitId,
          type: 'CREATE_HABIT',
          userId,
        }),
      ),
    onError: (_error, _variables, context) => {
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
    onMutate: async ({ clientHabitId, payload, userId }) => {
      await queryClient.cancelQueries({ queryKey: habitQueryKeys.list(userId) });

      const previousHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(userId)) ?? [];
      const optimisticHabit = createOptimisticHabit(payload, userId, clientHabitId);

      setCachedHabitQueryData(queryClient, userId, [optimisticHabit, ...previousHabits]);

      return {
        optimisticHabitId: optimisticHabit.id,
        userId,
      };
    },
    onSuccess: (result, _variables, context) => {
      if (!context || result.status !== 'synced' || !result.syncedEntity) {
        return;
      }

      const syncedHabit = decorateHabit(result.syncedEntity);

      const currentHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(context.userId)) ?? [];

      setCachedHabitQueryData(
        queryClient,
        context.userId,
        currentHabits.map((habit) =>
          habit.id === context.optimisticHabitId ? syncedHabit : habit,
        ),
      );
    },
  });

  function buildVariables(payload: CreateHabitPayload): CreateHabitMutationVariables {
    return {
      clientHabitId: createOptimisticHabitId(),
      payload,
      userId: resolveActiveUserId(),
    };
  }

  return {
    ...mutation,
    mutate: (payload: CreateHabitPayload) => {
      mutation.mutate(buildVariables(payload));
    },
    mutateAsync: (payload: CreateHabitPayload) => mutation.mutateAsync(buildVariables(payload)),
    variables: mutation.variables?.payload,
  };
}

export function useCheckInHabit() {
  const queryClient = useQueryClient();

  return useMutation<
    QueueSubmissionResult<HabitListItem>,
    Error,
    CheckInHabitInput,
    RestoreHabitContext | null
  >({
    mutationKey: ['habits', 'check-in'],
    mutationFn: ({ habitId }) => {
      const dayKey = getHabitDayKey();

      if (!dayKey) {
        throw new Error('The current date could not be resolved for this habit check-in.');
      }

      return enqueueAndSyncAction<HabitListItem>(
        createOfflineAction({
          dayKey,
          targetId: habitId,
          type: 'CHECKIN_HABIT',
          userId: resolveActiveUserId(),
        }),
      );
    },
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
    onSuccess: (result, variables, context) => {
      if (!context || result.status !== 'synced' || !result.syncedEntity) {
        return;
      }

      const currentHabits =
        queryClient.getQueryData<HabitListItem[]>(habitQueryKeys.list(context.userId)) ?? [];
      const syncedHabit = decorateHabit(result.syncedEntity);

      setCachedHabitQueryData(
        queryClient,
        context.userId,
        replaceHabit(currentHabits, variables.habitId, syncedHabit),
      );
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation<
    QueueSubmissionResult<never>,
    Error,
    DeleteHabitInput,
    RestoreDeletedHabitContext | null
  >({
    mutationKey: ['habits', 'delete'],
    mutationFn: ({ habitId }) =>
      enqueueAndSyncAction(
        createOfflineAction({
          targetId: habitId,
          type: 'DELETE_HABIT',
          userId: resolveActiveUserId(),
        }),
      ),
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
  });
}
