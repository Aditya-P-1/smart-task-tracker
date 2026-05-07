const {
  Habit,
  calculateHabitStreak,
  getUniqueSortedCompletedDates,
  normalizeDateToUtcStart,
  toHabitResponseObject,
  toUtcDayKey,
} = require('../models/habit.model');
const { AppError } = require('../utils/app-error');

function buildCreateHabitPayload({ title, userId }) {
  return {
    completedDates: [],
    streak: 0,
    title,
    userId,
  };
}

async function createHabit({ input, userId }) {
  const habit = await Habit.create(buildCreateHabitPayload({ ...input, userId }));

  return habit.toResponseObject();
}

async function getHabits({ userId }) {
  const habits = await Habit.find({ userId }).sort({ createdAt: -1 }).lean();

  return habits.map((habit) => toHabitResponseObject(habit));
}

async function deleteHabit({ habitId, userId }) {
  const habit = await Habit.findOneAndDelete({ _id: habitId, userId });

  if (!habit) {
    throw new AppError('Habit not found.', 404);
  }

  return habit.toResponseObject();
}

async function checkInHabit({ habitId, userId }) {
  const today = normalizeDateToUtcStart(new Date());
  const todayKey = toUtcDayKey(today);

  if (!today || !todayKey) {
    throw new AppError('Unable to determine the current day for habit check-in.', 500);
  }

  let habit = await Habit.findOneAndUpdate(
    {
      _id: habitId,
      userId,
      completedDates: { $ne: today },
    },
    {
      $addToSet: {
        completedDates: today,
      },
    },
    {
      new: true,
    },
  );

  if (!habit) {
    const existingHabit = await Habit.findOne({ _id: habitId, userId });

    if (!existingHabit) {
      throw new AppError('Habit not found.', 404);
    }

    const existingDateKeys = new Set(
      getUniqueSortedCompletedDates(existingHabit.completedDates).map((completedDate) =>
        completedDate.toISOString(),
      ),
    );

    if (existingDateKeys.has(todayKey)) {
      throw new AppError('Habit is already checked in for today.', 409);
    }

    throw new AppError('Habit check-in could not be completed. Please try again.', 409);
  }

  const nextCompletedDates = getUniqueSortedCompletedDates(habit.completedDates);

  habit.completedDates = nextCompletedDates;
  habit.streak = calculateHabitStreak(nextCompletedDates, today);
  await habit.save();

  return habit.toResponseObject(today);
}

module.exports = {
  checkInHabit,
  createHabit,
  deleteHabit,
  getHabits,
};
