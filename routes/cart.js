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
  checkout,
  webhook
} = require('../controllers/cartController');

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

// Gerenciar participantes
router.get('/participants', getParticipants);
router.post('/participants/add', addParticipant);
router.post('/participants/remove', removeParticipant);

// Finalizar compra
router.post('/checkout', checkout);

// Webhook para notificações do Mercado Pago
router.post('/webhook', webhook);

module.exports = router;
