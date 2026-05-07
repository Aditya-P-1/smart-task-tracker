const express = require('express');

const taskController = require('../controllers/task.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const {
  validateCreateTaskRequest,
  validateDeleteTaskRequest,
  validateUpdateTaskRequest,
} = require('../validators/task.validator');

const router = express.Router();

router.use(requireAuth);

router
  .route('/')
  .get(taskController.getTasks)
  .post(validateRequest(validateCreateTaskRequest), taskController.createTask);

router
  .route('/:id')
  .put(validateRequest(validateUpdateTaskRequest), taskController.updateTask)
  .delete(validateRequest(validateDeleteTaskRequest), taskController.deleteTask);

module.exports = router;
