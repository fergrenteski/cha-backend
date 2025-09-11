const express = require('express');
const router = express.Router();
const { 
  createOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  updateOrderStatus,
  getOrderStats,
  getOrderAdminStats,
  deleteOrder
} = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Criar novo pedido a partir do carrinho
router.post('/create', auth, createOrder);

// Obter pedidos do usuário (com filtros opcionais)
router.get('/', auth, getUserOrders);

// Obter estatísticas dos pedidos do usuário
router.get('/stats', auth, getOrderStats);

// Obter estatísticas dos pedidos do usuário
router.get('/stats/admin', auth, getOrderAdminStats);

// Obter detalhes de um pedido específico
router.get('/:orderId', auth, getOrderDetails);

// Obter detalhes de um pedido específico
router.delete('/:orderId', auth, deleteOrder);

// Cancelar pedido
router.put('/:orderId/cancel', auth, cancelOrder);

// Atualizar status do pedido (para admins)
router.put('/:orderId/status', updateOrderStatus);

module.exports = router;
