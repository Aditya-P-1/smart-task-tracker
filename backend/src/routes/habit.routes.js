const express = require('express');

const habitController = require('../controllers/habit.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const {
  validateCreateHabitRequest,
  validateDeleteHabitRequest,
  validateHabitCheckInRequest,
} = require('../validators/habit.validator');

const router = express.Router();

router.use(requireAuth);

router
  .route('/')
  .get(habitController.getHabits)
  .post(validateRequest(validateCreateHabitRequest), habitController.createHabit);

router
  .route('/:id')
  .delete(validateRequest(validateDeleteHabitRequest), habitController.deleteHabit);

router
  .route('/:id/check-in')
  .post(validateRequest(validateHabitCheckInRequest), habitController.checkInHabit);

module.exports = router;
