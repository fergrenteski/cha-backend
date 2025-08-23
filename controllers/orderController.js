const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

// Criar novo pedido a partir do carrinho
const createOrder = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'Token de autenticação obrigatório' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { notes, orderNumber } = req.body;

    // Buscar carrinho do usuário
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ msg: 'Carrinho vazio' });
    }

    // Validar se todos os produtos ainda existem e calcular total
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of cart.products) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(400).json({ 
          msg: `Produto ${item.product.name} não está mais disponível` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        productName: product.name,
        productDescription: product.description,
        productImage: product.image || null
      });
    }

    // Criar pedido
    const order = new Order({
      user: userId,
      orderNumber: orderNumber,
      products: orderProducts,
      participants: cart.participants || [],
      totalAmount,
      notes,
      status: 'pending'
    });

    await order.save();

    // Limpar carrinho após criar pedido
    cart.products = [];
    cart.participants = [];
    await cart.save();

    // Retornar pedido com produtos populados
    await order.populate('products.product user', 'name email');
    res.status(201).json({
      msg: 'Pedido criado com sucesso',
      order
    });

  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ msg: 'Erro ao criar pedido' });
  }
};

// Obter pedidos do usuário
const getUserOrders = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'Token de autenticação obrigatório' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { status, page = 1, limit = 10, admin = false } = req.query;

    // Construir filtro
    const filter = {}

    // Filtra Admin
    if(!admin) {
      filter.user = userId;
    }
    if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    // Calcular paginação
    const skip = (page - 1) * limit;

    // Buscar pedidos
    const orders = await Order.find(filter)
      .populate('products.product user')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de pedidos
    const totalOrders = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasMore: skip + orders.length < totalOrders
      }
    });

  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ msg: 'Erro ao buscar pedidos' });
  }
};

// Obter detalhes de um pedido específico
const getOrderDetails = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'Token de autenticação obrigatório' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ 
      _id: orderId, 
      user: userId
    }).populate('products.product user', 'firstName lastName email phone cart price, description');

    if (!order) {
      return res.status(404).json({ msg: 'Pedido não encontrado' });
    }

    res.json(order);

  } catch (err) {
    console.error('Erro ao buscar detalhes do pedido:', err);
    res.status(500).json({ msg: 'Erro ao buscar detalhes do pedido' });
  }
};

// Cancelar pedido (apenas se status for pending)
const cancelOrder = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'Token de autenticação obrigatório' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { orderId } = req.params;
    const { cancelReason } = req.body;

    const order = await Order.findOne({ 
      _id: orderId, 
      user: userId 
    });

    if (!order) {
      return res.status(404).json({ msg: 'Pedido não encontrado' });
    }

    // Verificar se pedido pode ser cancelado
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        msg: 'Apenas pedidos pendentes podem ser cancelados' 
      });
    }

    order.status = 'cancelled';
    order.cancelReason = cancelReason || 'Cancelado pelo cliente';
    await order.save();

    await order.populate('products.product user', 'name email images price');

    res.json({
      msg: 'Pedido cancelado com sucesso',
      order
    });

  } catch (err) {
    console.error('Erro ao cancelar pedido:', err);
    res.status(500).json({ msg: 'Erro ao cancelar pedido' });
  }
};

// Atualizar status do pedido (para admins)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Status inválido. Use: pending, completed ou cancelled' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate('products.product user', 'name email images price');

    if (!order) {
      return res.status(404).json({ msg: 'Pedido não encontrado' });
    }

    res.json({
      msg: 'Status do pedido atualizado com sucesso',
      order
    });

  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err);
    res.status(500).json({ msg: 'Erro ao atualizar status do pedido' });
  }
};

// Obter estatísticas dos pedidos do usuário
const getOrderStats = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'Token de autenticação obrigatório' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Contar pedidos por status
    const pendingCount = await Order.countDocuments({ user: userId, status: 'pending' });
    const completedCount = await Order.countDocuments({ user: userId, status: 'completed' });
    const cancelledCount = await Order.countDocuments({ user: userId, status: 'cancelled' });
    
    // Total gasto em pedidos completados
    const totalSpentResult = await Order.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalSpent = totalSpentResult[0]?.total || 0;
    const totalOrders = pendingCount + completedCount + cancelledCount;

    res.json({
      totalOrders,
      totalSpent,
      ordersByStatus: {
        pending: pendingCount,
        completed: completedCount,
        cancelled: cancelledCount
      }
    });

  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    res.status(500).json({ msg: 'Erro ao buscar estatísticas' });
  }
};

const getOrderAdminStats = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'Token de autenticação obrigatório' });
    }

    // Contar pedidos por status
    const pendingCount = await Order.countDocuments({ status: 'pending' });
    const completedCount = await Order.countDocuments({ status: 'completed' });
    const cancelledCount = await Order.countDocuments({ status: 'cancelled' });

    // Total gasto em pedidos completados
    const totalSpentResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalSpent = totalSpentResult[0]?.total || 0;
    const totalOrders = pendingCount + completedCount + cancelledCount;

    res.json({
      totalOrders,
      totalSpent,
      ordersByStatus: {
        pending: pendingCount,
        completed: completedCount,
        cancelled: cancelledCount
      }
    });

  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    res.status(500).json({ msg: 'Erro ao buscar estatísticas' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  updateOrderStatus,
  getOrderStats,
  getOrderAdminStats
};
