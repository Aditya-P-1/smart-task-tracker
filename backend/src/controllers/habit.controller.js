const { sendSuccessResponse } = require('../utils/api-response');
const { asyncHandler } = require('../utils/async-handler');
const habitService = require('../services/habit.service');

const createHabit = asyncHandler(async (req, res) => {
  const habit = await habitService.createHabit({
    input: req.body,
    userId: req.auth.userId,
  });

  return sendSuccessResponse(res, {
    data: habit,
    message: 'Habit created successfully.',
    statusCode: 201,
  });
});

const getHabits = asyncHandler(async (req, res) => {
  const habits = await habitService.getHabits({
    userId: req.auth.userId,
  });

  return sendSuccessResponse(res, {
    data: habits,
    message: 'Habits fetched successfully.',
  });
});

const deleteHabit = asyncHandler(async (req, res) => {
  const habit = await habitService.deleteHabit({
    habitId: req.params.id,
    userId: req.auth.userId,
  });

  return sendSuccessResponse(res, {
    data: habit,
    message: 'Habit deleted successfully.',
  });
});

const checkInHabit = asyncHandler(async (req, res) => {
  const habit = await habitService.checkInHabit({
    habitId: req.params.id,
    userId: req.auth.userId,
  });

  return sendSuccessResponse(res, {
    data: habit,
    message: 'Habit checked in successfully.',
  });
});

module.exports = {
  checkInHabit,
  createHabit,
  deleteHabit,
  getHabits,
};
