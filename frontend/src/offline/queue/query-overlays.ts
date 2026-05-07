import { buildOptimisticHabitCheckIn, decorateHabit } from '../../features/habits/utils/habit';
import type { HabitListItem } from '../../features/habits/types/habit';
import {
  removeTask,
  upsertTask,
} from '../../features/tasks/query-cache';
import type { TaskListItem } from '../../features/tasks/types/task';

import { getQueuedActions } from './action-queue';

function createTaskFromQueuedCreate(
  action: Extract<ReturnType<typeof getQueuedActions>[number], { type: 'CREATE_TASK' }>,
): TaskListItem {
  return {
    completed: action.payload.completed ?? false,
    createdAt: action.createdAt,
    description: action.payload.description ?? '',
    dueDate: action.payload.dueDate ?? null,
    id: action.targetId,
    isPending: true,
    title: action.payload.title,
    updatedAt: action.createdAt,
    userId: action.userId,
  };
}

function buildTaskFromQueuedUpdate(
  task: TaskListItem,
  action: Extract<ReturnType<typeof getQueuedActions>[number], { type: 'UPDATE_TASK' }>,
): TaskListItem {
  return {
    ...task,
    completed: action.payload.completed ?? task.completed,
    description: action.payload.description ?? task.description,
    dueDate: typeof action.payload.dueDate === 'undefined' ? task.dueDate : action.payload.dueDate,
    isPending: true,
    title: action.payload.title ?? task.title,
    updatedAt: action.createdAt,
  };
}

function createHabitFromQueuedCreate(
  action: Extract<ReturnType<typeof getQueuedActions>[number], { type: 'CREATE_HABIT' }>,
): HabitListItem {
  return decorateHabit({
    completedDates: [],
    createdAt: action.createdAt,
    id: action.targetId,
    isPending: true,
    streak: 0,
    title: action.payload.title,
    updatedAt: action.createdAt,
    userId: action.userId,
  });
}

export function applyQueuedTaskActions(tasks: TaskListItem[], userId: string) {
  const queuedTaskActions = getQueuedActions().filter(
    (action) =>
      action.userId === userId &&
      (action.type === 'CREATE_TASK' ||
        action.type === 'UPDATE_TASK' ||
        action.type === 'DELETE_TASK'),
  );

  if (queuedTaskActions.length === 0) {
    return tasks;
  }

  return queuedTaskActions.reduce<TaskListItem[]>((currentTasks, action) => {
      switch (action.type) {
        case 'CREATE_TASK':
          return upsertTask(
            currentTasks,
            createTaskFromQueuedCreate(action),
          );

        case 'UPDATE_TASK': {
          const existingTask = currentTasks.find((task) => task.id === action.targetId);

          if (!existingTask) {
            return currentTasks;
          }

          return currentTasks.map((task) =>
            task.id === action.targetId ? buildTaskFromQueuedUpdate(task, action) : task,
          );
        }

        case 'DELETE_TASK':
          return removeTask(currentTasks, action.targetId);

        default:
          return currentTasks;
      }
    }, tasks);
}

function replaceHabit(habits: HabitListItem[], habitId: string, nextHabit: HabitListItem) {
  return habits.map((habit) => (habit.id === habitId ? nextHabit : habit));
}

function removeHabit(habits: HabitListItem[], habitId: string) {
  return habits.filter((habit) => habit.id !== habitId);
}

function upsertHabit(habits: HabitListItem[], nextHabit: HabitListItem) {
  return habits.some((habit) => habit.id === nextHabit.id)
    ? replaceHabit(habits, nextHabit.id, nextHabit)
    : [...habits, nextHabit];
}

export function applyQueuedHabitActions(habits: HabitListItem[], userId: string) {
  const queuedHabitActions = getQueuedActions().filter(
    (action) =>
      action.userId === userId &&
      (action.type === 'CREATE_HABIT' ||
        action.type === 'CHECKIN_HABIT' ||
        action.type === 'DELETE_HABIT'),
  );

  if (queuedHabitActions.length === 0) {
    return habits;
  }

  return queuedHabitActions.reduce<HabitListItem[]>((currentHabits, action) => {
      switch (action.type) {
        case 'CREATE_HABIT':
          return upsertHabit(
            currentHabits,
            createHabitFromQueuedCreate(action),
          );

        case 'CHECKIN_HABIT': {
          const existingHabit = currentHabits.find((habit) => habit.id === action.targetId);

          if (!existingHabit) {
            return currentHabits;
          }

          return replaceHabit(
            currentHabits,
            action.targetId,
            buildOptimisticHabitCheckIn(existingHabit, action.dayKey),
          );
        }

        case 'DELETE_HABIT':
          return removeHabit(currentHabits, action.targetId);

        default:
          return currentHabits;
      }
    }, habits);
}
