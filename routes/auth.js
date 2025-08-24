const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// Registro (com rate limiting)
router.post('/register', authLimiter, register);

// Login (com rate limiting)
router.post('/login', authLimiter, login);

module.exports = router;
