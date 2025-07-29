const express = require('express');
const router = express.Router();
const { register, login, createGuest } = require('../controllers/authController');

// Registro
router.post('/register', register);

// Login
router.post('/login', login);

// Registro de convidado
router.post('/guest', createGuest);

module.exports = router;
