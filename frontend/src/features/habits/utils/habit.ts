import type { CreateHabitPayload, Habit, HabitFormValues, HabitListItem } from '../types/habit';

export const DEFAULT_HABIT_FORM_VALUES: HabitFormValues = {
  title: '',
};

function normalizeDateToUtcStart(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toUtcDayKey(value: string | Date) {
  const normalizedDate = normalizeDateToUtcStart(value);

  return normalizedDate ? normalizedDate.toISOString() : null;
}

export function getHabitDayKey(value: string | Date = new Date()) {
  return toUtcDayKey(value);
}

function getUniqueSortedCompletedDates(completedDates: string[]) {
  const uniqueDates = new Map<string, string>();

  for (const completedDate of completedDates) {
    const dayKey = toUtcDayKey(completedDate);

    if (!dayKey) {
      continue;
    }

    uniqueDates.set(dayKey, dayKey);
  }

  return [...uniqueDates.values()].sort((left, right) => left.localeCompare(right));
}

function getDayDifference(laterDate: string | Date, earlierDate: string | Date) {
  const laterDay = normalizeDateToUtcStart(laterDate);
  const earlierDay = normalizeDateToUtcStart(earlierDate);

  if (!laterDay || !earlierDay) {
    return Number.NaN;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((laterDay.getTime() - earlierDay.getTime()) / millisecondsPerDay);
}

export function calculateHabitStreak(
  completedDates: string[],
  referenceDate: string | Date = new Date(),
) {
  const normalizedDates = getUniqueSortedCompletedDates(completedDates);

  if (normalizedDates.length === 0) {
    return 0;
  }

  const latestCompletedDate = normalizedDates[normalizedDates.length - 1];
  const distanceFromReference = getDayDifference(referenceDate, latestCompletedDate);

  if (Number.isNaN(distanceFromReference) || distanceFromReference < 0 || distanceFromReference > 1) {
    return 0;
  }

  let streak = 1;

  for (let index = normalizedDates.length - 1; index > 0; index -= 1) {
    const currentDate = normalizedDates[index];
    const previousDate = normalizedDates[index - 1];

    if (getDayDifference(currentDate, previousDate) !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function isHabitCompletedToday(habit: Habit | HabitListItem, referenceDate: string | Date = new Date()) {
  const todayKey = toUtcDayKey(referenceDate);

  if (!todayKey) {
    return false;
  }

  return getUniqueSortedCompletedDates(habit.completedDates).includes(todayKey);
}

function formatLatestCheckInFromDates(completedDates: string[]) {
  const latestCheckIn = completedDates[completedDates.length - 1];

  if (!latestCheckIn) {
    return 'No check-ins yet';
  }

  return new Date(latestCheckIn).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

export function decorateHabit(
  habit: Habit | HabitListItem,
  referenceDate: string | Date = new Date(),
): HabitListItem {
  const normalizedCompletedDates = getUniqueSortedCompletedDates(habit.completedDates);
  const completedToday = isHabitCompletedToday(
    {
      ...habit,
      completedDates: normalizedCompletedDates,
    },
    referenceDate,
  );

  return {
    ...habit,
    completedDates: normalizedCompletedDates,
    completedToday,
    latestCheckInLabel: formatLatestCheckInFromDates(normalizedCompletedDates),
  };
}

export function compareHabits(left: HabitListItem, right: HabitListItem) {
  const leftCompletedToday = left.completedToday ?? isHabitCompletedToday(left);
  const rightCompletedToday = right.completedToday ?? isHabitCompletedToday(right);

  if (leftCompletedToday !== rightCompletedToday) {
    return leftCompletedToday ? 1 : -1;
  }

  if (left.streak !== right.streak) {
    return right.streak - left.streak;
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

export function sortHabits(habits: HabitListItem[]) {
  return [...habits].sort(compareHabits);
}

export function buildCreateHabitPayload(values: HabitFormValues): CreateHabitPayload {
  return {
    title: values.title.trim(),
  };
}

export function createOptimisticHabit(
  payload: CreateHabitPayload,
  userId: string,
  habitId = `temp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
): HabitListItem {
  const now = new Date().toISOString();

  return decorateHabit({
    completedDates: [],
    createdAt: now,
    id: habitId,
    isPending: true,
    streak: 0,
    title: payload.title,
    updatedAt: now,
    userId,
  });
}

export function buildOptimisticHabitCheckIn(habit: HabitListItem, referenceDate: string | Date = new Date()) {
  const todayKey = toUtcDayKey(referenceDate);

  if (!todayKey || isHabitCompletedToday(habit, referenceDate)) {
    return decorateHabit({
      ...habit,
      isPending: true,
    }, referenceDate);
  }

  const completedDates = getUniqueSortedCompletedDates([...habit.completedDates, todayKey]);

  return decorateHabit({
    ...habit,
    completedDates,
    isPending: true,
    streak: calculateHabitStreak(completedDates, referenceDate),
    updatedAt: new Date().toISOString(),
  }, referenceDate);
}

export function formatLatestCheckIn(habit: Habit | HabitListItem) {
  if ('latestCheckInLabel' in habit && typeof habit.latestCheckInLabel === 'string') {
    return habit.latestCheckInLabel;
  }

  return formatLatestCheckInFromDates(getUniqueSortedCompletedDates(habit.completedDates));
}
