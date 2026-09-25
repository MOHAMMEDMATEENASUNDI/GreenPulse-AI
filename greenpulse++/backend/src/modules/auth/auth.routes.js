const express = require('express');
const authController = require('./auth.controller');
const { signupSchema, loginSchema } = require('./auth.validator');
const validate = require('../../middleware/validate.middleware');
const { requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected verification route (Phase 1 verification only)
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
