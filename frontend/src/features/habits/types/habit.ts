export type Habit = {
  completedDates: string[];
  createdAt: string;
  id: string;
  streak: number;
  title: string;
  updatedAt: string;
  userId: string;
};

export type HabitListItem = Habit & {
  completedToday?: boolean;
  isPending?: boolean;
  latestCheckInLabel?: string;
};

export type CreateHabitPayload = {
  title: string;
};

export type CheckInHabitInput = {
  habitId: string;
};

export type DeleteHabitInput = {
  habitId: string;
};

export type RestoreHabitContext = {
  previousHabit: HabitListItem;
  userId: string;
};

export type RestoreDeletedHabitContext = {
  deletedHabit: HabitListItem;
  userId: string;
};

export type HabitFormValues = {
  title: string;
};

export type CachedHabitList = {
  habits: Habit[];
  updatedAt: string;
  userId: string;
};
