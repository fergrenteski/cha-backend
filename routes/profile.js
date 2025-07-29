const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, deleteUser } = require('../controllers/profileController');

// Obter perfil
router.get('/', auth, getProfile);

// Atualizar perfil
router.put('/', auth, updateProfile);

// Excluir usuário
router.delete('/', auth, deleteUser);

module.exports = router;
