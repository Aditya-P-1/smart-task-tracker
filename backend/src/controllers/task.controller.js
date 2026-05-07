const { sendSuccessResponse } = require('../utils/api-response');
const { asyncHandler } = require('../utils/async-handler');
const taskService = require('../services/task.service');

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    input: req.body,
    userId: req.auth.userId,
  });

  return sendSuccessResponse(res, {
    data: task,
    message: 'Task created successfully.',
    statusCode: 201,
  });
});

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasks({
    userId: req.auth.userId,
  });

  return sendSuccessResponse(res, {
    data: tasks,
    message: 'Tasks fetched successfully.',
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask({
    input: req.body,
    taskId: req.params.id,
    userId: req.auth.userId,
  });

  return sendSuccessResponse(res, {
    data: task,
    message:
      req.body.completed === true
        ? 'Task updated successfully and marked complete.'
        : 'Task updated successfully.',
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask({
    taskId: req.params.id,
    userId: req.auth.userId,
  });

  return sendSuccessResponse(res, {
    data: task,
    message: 'Task deleted successfully.',
  });
});

module.exports = {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
};
