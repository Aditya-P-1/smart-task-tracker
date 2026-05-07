const mongoose = require('mongoose');

const { HABIT_TITLE_MAX_LENGTH } = require('../models/habit.model');

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateHabitIdParam(req) {
  const id = normalizeString(req.params?.id);
  const errors = [];

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    errors.push({
      field: 'id',
      message: 'A valid habit id is required.',
    });
  }

  return {
    errors,
    isValid: errors.length === 0,
    sanitizedParams: {
      id,
    },
  };
}

function validateCreateHabitRequest(req) {
  const title = normalizeString(req.body?.title);
  const errors = [];

  if (!title || title.length > HABIT_TITLE_MAX_LENGTH) {
    errors.push({
      field: 'title',
      message: `Title is required and must be between 1 and ${HABIT_TITLE_MAX_LENGTH} characters.`,
    });
  }

  return {
    errors,
    isValid: errors.length === 0,
    sanitizedBody: {
      title,
    },
  };
}

function validateDeleteHabitRequest(req) {
  return validateHabitIdParam(req);
}

function validateHabitCheckInRequest(req) {
  return validateHabitIdParam(req);
}

module.exports = {
  validateCreateHabitRequest,
  validateDeleteHabitRequest,
  validateHabitCheckInRequest,
};
