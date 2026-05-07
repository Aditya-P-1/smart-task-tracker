const { Task, toTaskResponseObject } = require('../models/task.model');
const { AppError } = require('../utils/app-error');

function buildCreateTaskPayload({ completed, description, dueDate, title, userId }) {
  return {
    completed: typeof completed === 'boolean' ? completed : false,
    description: typeof description === 'string' ? description : '',
    dueDate: typeof dueDate === 'undefined' ? null : dueDate,
    title,
    userId,
  };
}

function buildUpdateTaskPayload({ completed, description, dueDate, title }) {
  const payload = {};

  if (typeof title !== 'undefined') {
    payload.title = title;
  }

  if (typeof description !== 'undefined') {
    payload.description = description;
  }

  if (typeof dueDate !== 'undefined') {
    payload.dueDate = dueDate;
  }

  if (typeof completed !== 'undefined') {
    payload.completed = completed;
  }

  return payload;
}

async function createTask({ input, userId }) {
  const task = await Task.create(buildCreateTaskPayload({ ...input, userId }));

  return task.toResponseObject();
}

async function getTasks({ userId }) {
  const tasks = await Task.find({ userId })
    .sort({ completed: 1, dueDate: 1, createdAt: -1 })
    .lean();

  return tasks.map(toTaskResponseObject);
}

async function updateTask({ input, taskId, userId }) {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    buildUpdateTaskPayload(input),
    {
      new: true,
      runValidators: true,
    },
  );

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  return task.toResponseObject();
}

async function deleteTask({ taskId, userId }) {
  const task = await Task.findOneAndDelete({ _id: taskId, userId });

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  return task.toResponseObject();
}

module.exports = {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
};
