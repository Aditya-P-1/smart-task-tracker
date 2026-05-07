const mongoose = require('mongoose');
const {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} = require('../models/task.model');

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalDescription(value) {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === null) {
    return '';
  }

  return typeof value === 'string' ? value.trim() : value;
}

function normalizeOptionalDate(value) {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? value : new Date(value.getTime());
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return null;
  }

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date;
}

function normalizeOptionalBoolean(value) {
  if (typeof value === 'undefined') {
    return undefined;
  }

  return value;
}

function validateTaskIdParam(req) {
  const id = normalizeString(req.params?.id);
  const errors = [];

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    errors.push({
      field: 'id',
      message: 'A valid task id is required.',
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

function validateCreateTaskRequest(req) {
  const title = normalizeString(req.body?.title);
  const description = normalizeOptionalDescription(req.body?.description);
  const dueDate = normalizeOptionalDate(req.body?.dueDate);
  const completed = normalizeOptionalBoolean(req.body?.completed);
  const errors = [];

  if (!title || title.length > TASK_TITLE_MAX_LENGTH) {
    errors.push({
      field: 'title',
      message: `Title is required and must be between 1 and ${TASK_TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (typeof description !== 'undefined' && typeof description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description must be a string.',
    });
  }

  if (typeof description === 'string' && description.length > TASK_DESCRIPTION_MAX_LENGTH) {
    errors.push({
      field: 'description',
      message: `Description cannot exceed ${TASK_DESCRIPTION_MAX_LENGTH} characters.`,
    });
  }

  if (typeof dueDate !== 'undefined' && dueDate !== null && !(dueDate instanceof Date)) {
    errors.push({
      field: 'dueDate',
      message: 'Due date must be a valid date.',
    });
  }

  if (typeof completed !== 'undefined' && typeof completed !== 'boolean') {
    errors.push({
      field: 'completed',
      message: 'Completed must be a boolean value.',
    });
  }

  return {
    errors,
    isValid: errors.length === 0,
    sanitizedBody: {
      completed: typeof completed === 'boolean' ? completed : undefined,
      description: typeof description === 'string' ? description : undefined,
      dueDate: typeof dueDate === 'undefined' ? undefined : dueDate,
      title,
    },
  };
}

function validateUpdateTaskRequest(req) {
  const idValidation = validateTaskIdParam(req);
  const title = typeof req.body?.title === 'undefined' ? undefined : normalizeString(req.body?.title);
  const description = normalizeOptionalDescription(req.body?.description);
  const dueDate = normalizeOptionalDate(req.body?.dueDate);
  const completed = normalizeOptionalBoolean(req.body?.completed);
  const hasRecognizedField =
    typeof req.body?.title !== 'undefined' ||
    typeof req.body?.description !== 'undefined' ||
    typeof req.body?.dueDate !== 'undefined' ||
    typeof req.body?.completed !== 'undefined';
  const errors = [...idValidation.errors];
  const sanitizedBody = {};

  if (typeof req.body?.title !== 'undefined') {
    if (!title || title.length > TASK_TITLE_MAX_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title must be between 1 and ${TASK_TITLE_MAX_LENGTH} characters.`,
      });
    } else {
      sanitizedBody.title = title;
    }
  }

  if (typeof req.body?.description !== 'undefined') {
    if (typeof description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string.',
      });
    } else if (description.length > TASK_DESCRIPTION_MAX_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description cannot exceed ${TASK_DESCRIPTION_MAX_LENGTH} characters.`,
      });
    } else {
      sanitizedBody.description = description;
    }
  }

  if (typeof req.body?.dueDate !== 'undefined') {
    if (dueDate !== null && !(dueDate instanceof Date)) {
      errors.push({
        field: 'dueDate',
        message: 'Due date must be a valid date.',
      });
    } else {
      sanitizedBody.dueDate = dueDate;
    }
  }

  if (typeof req.body?.completed !== 'undefined') {
    if (typeof completed !== 'boolean') {
      errors.push({
        field: 'completed',
        message: 'Completed must be a boolean value.',
      });
    } else {
      sanitizedBody.completed = completed;
    }
  }

  if (!hasRecognizedField) {
    errors.push({
      field: 'body',
      message: 'At least one task field must be provided for update.',
    });
  }

  return {
    errors,
    isValid: errors.length === 0,
    sanitizedBody,
    sanitizedParams: idValidation.sanitizedParams,
  };
}

function validateDeleteTaskRequest(req) {
  return validateTaskIdParam(req);
}

module.exports = {
  validateCreateTaskRequest,
  validateDeleteTaskRequest,
  validateUpdateTaskRequest,
};
