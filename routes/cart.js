const express = require('express');
const router = express.Router();
const { 
  getCart, 
  addToCart, 
  removeFromCart, 
  clearCart, 
  updateQuantity,
  addParticipant,
  removeParticipant,
  getParticipants,
  migrateGuestCart
} = require('../controllers/cartController');
const auth = require('../middleware/auth');

// Obter carrinho (usuário ou convidado)
router.get('/', getCart);

// Adicionar produto ao carrinho
router.post('/add', addToCart);

// Atualizar quantidade de produto no carrinho
router.put('/update-quantity', updateQuantity);

// Remover produto do carrinho
router.post('/remove', removeFromCart);

// Limpar carrinho
router.post('/clear', clearCart);

// Migrar carrinho de convidado para usuário logado
router.post('/migrate', auth, migrateGuestCart);

// Gerenciar participantes
router.get('/participants', getParticipants);
router.post('/participants/add', addParticipant);
router.post('/participants/remove', removeParticipant);

module.exports = router;
