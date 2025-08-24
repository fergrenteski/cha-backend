const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin, preventSelfDemotion } = require('../middleware/adminAuth');
const { toggleAdmin, getAllUsers, deleteUser } = require('../controllers/userController');

// Obter todos os usuários (apenas admin)
router.get('/', auth, requireAdmin, getAllUsers);

// Deletar usuário (apenas admin, não pode deletar a si mesmo)
router.delete('/:id/delete', auth, requireAdmin, preventSelfDemotion, deleteUser);

// Adiciona/Remove usuário como Admin (apenas admin, não pode se remover)
router.post('/:id/admin', auth, requireAdmin, preventSelfDemotion, toggleAdmin);

// Endpoint de teste para verificar se as rotas estão funcionando
router.get('/test', (req, res) => {
  res.status(200).json({
    msg: 'Rotas de usuário funcionando corretamente',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /api/users': 'Listar usuários (admin only)',
      'POST /api/users/:id/admin': 'Toggle admin (admin only)',
      'DELETE /api/users/:id/delete': 'Deletar usuário (admin only)',
      'GET /api/users/test': 'Teste de funcionamento'
    }
  });
});

module.exports = router;
