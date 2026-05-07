const express = require('express');

const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middlewares/validation.middleware');
const {
  validateLoginRequest,
  validateSignupRequest,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/signup', validateRequest(validateSignupRequest), authController.signup);
router.post('/login', validateRequest(validateLoginRequest), authController.login);
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;
