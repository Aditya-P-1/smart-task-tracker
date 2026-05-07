const mongoose = require('mongoose');

const HABIT_TITLE_MAX_LENGTH = 140;

function isValidDateInstance(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function normalizeDateToUtcStart(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (!isValidDateInstance(date)) {
    return null;
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toUtcDayKey(value) {
  const normalizedDate = normalizeDateToUtcStart(value);

  return normalizedDate ? normalizedDate.toISOString() : null;
}

function getDayDifference(laterDate, earlierDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (normalizeDateToUtcStart(laterDate).getTime() - normalizeDateToUtcStart(earlierDate).getTime()) /
      millisecondsPerDay,
  );
}

function getUniqueSortedCompletedDates(completedDates) {
  const uniqueDates = new Map();

  for (const completedDate of completedDates ?? []) {
    const normalizedDate = normalizeDateToUtcStart(completedDate);

    if (!normalizedDate) {
      continue;
    }

    uniqueDates.set(normalizedDate.toISOString(), normalizedDate);
  }

  return [...uniqueDates.values()].sort((left, right) => left.getTime() - right.getTime());
}

function calculateHabitStreakFromNormalizedDates(normalizedDates, referenceDate = new Date()) {
  if (normalizedDates.length === 0) {
    return 0;
  }

  const latestCompletedDate = normalizedDates[normalizedDates.length - 1];
  const distanceFromReference = getDayDifference(referenceDate, latestCompletedDate);

  if (distanceFromReference < 0 || distanceFromReference > 1) {
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

function calculateHabitStreak(completedDates, referenceDate = new Date()) {
  return calculateHabitStreakFromNormalizedDates(
    getUniqueSortedCompletedDates(completedDates),
    referenceDate,
  );
}

const habitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: HABIT_TITLE_MAX_LENGTH,
      minlength: 1,
      trim: true,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedDates: {
      type: [Date],
      default: [],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

habitSchema.index({ userId: 1, createdAt: -1 });

function toHabitResponseObject(habit, referenceDate) {
  const normalizedCompletedDates = getUniqueSortedCompletedDates(habit.completedDates);
  const completedDates = normalizedCompletedDates.map((date) => date.toISOString());

  return {
    completedDates,
    createdAt: habit.createdAt,
    id: habit._id.toString(),
    streak: calculateHabitStreakFromNormalizedDates(normalizedCompletedDates, referenceDate),
    title: habit.title,
    updatedAt: habit.updatedAt,
    userId: habit.userId.toString(),
  };
}

habitSchema.methods.toResponseObject = function toResponseObject(referenceDate) {
  return toHabitResponseObject(this, referenceDate);
};

module.exports = {
  Habit: mongoose.model('Habit', habitSchema),
  HABIT_TITLE_MAX_LENGTH,
  calculateHabitStreak,
  calculateHabitStreakFromNormalizedDates,
  getUniqueSortedCompletedDates,
  normalizeDateToUtcStart,
  toHabitResponseObject,
  toUtcDayKey,
};
