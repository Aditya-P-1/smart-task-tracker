const express = require('express');

const authRoutes = require('./auth.routes');
const healthRoutes = require('./health.routes');
const habitRoutes = require('./habit.routes');
const taskRoutes = require('./task.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/habits', habitRoutes);
router.use('/tasks', taskRoutes);

module.exports = router;
