const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { toggleAdmin, getAllUsers, deleteUser } = require('../controllers/userController');

// Obter Todos os usuários
router.get('/', auth, getAllUsers);

// Deletar usuário
router.delete('/:id/delete', auth, deleteUser);

// Adiciona/Remove usuário como Admin
router.post('/:id/admin', auth, toggleAdmin);

module.exports = router;
