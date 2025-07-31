const Cart = require('../models/Cart');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Obter carrinho (usuário ou convidado)
const getCart = async (req, res) => {
  try {
    let cart;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      cart = await Cart.findOne({ user: decoded.id }).populate('products.product');
    } else if (req.query.guestToken) {
      cart = await Cart.findOne({ guestToken: req.query.guestToken }).populate('products.product');
    }
    
    res.json(cart || { products: [], participants: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao buscar carrinho' });
  }
};

// Adicionar produto ao carrinho
const addToCart = async (req, res) => {
  const { productId, quantity, guestToken } = req.body;
  
  try {
    let cart;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      cart = await Cart.findOne({ user: decoded.id }) || new Cart({ user: decoded.id });
      
      const idx = cart.products.findIndex(p => p.product.toString() === productId);
      if (idx > -1) {
        cart.products[idx].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
      
      await cart.save();
      return res.json(cart);
    } else if (guestToken) {
      cart = await Cart.findOne({ guestToken }) || new Cart({ guestToken });
      
      const idx = cart.products.findIndex(p => p.product.toString() === productId);
      if (idx > -1) {
        cart.products[idx].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
      
      await cart.save();
      return res.json(cart);
    }
    
    res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao adicionar produto ao carrinho' });
  }
};

// Remover produto do carrinho
const removeFromCart = async (req, res) => {
  const { productId, guestToken } = req.body;
  
  try {
    let cart;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      cart = await Cart.findOne({ user: decoded.id });
      
      if (!cart) return res.status(404).json({ msg: 'Carrinho não encontrado' });
      cart.products = cart.products.filter(p => p.product.toString() !== productId);
      await cart.save();
      return res.json(cart);
    } else if (guestToken) {
      cart = await Cart.findOne({ guestToken });
      
      if (!cart) return res.status(404).json({ msg: 'Carrinho não encontrado' });
      
      cart.products = cart.products.filter(p => p.product.toString() !== productId);
      await cart.save();
      return res.json(cart);
    }
    
    res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao remover produto do carrinho' });
  }
};

// Limpar carrinho
const clearCart = async (req, res) => {
  const { guestToken } = req.body;
  
  try {
    let cart;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      cart = await Cart.findOne({ user: decoded.id });
      
      if (!cart) return res.status(404).json({ msg: 'Carrinho não encontrado' });
      
      cart.products = [];
      await cart.save();
      return res.json(cart);
    } else if (guestToken) {
      cart = await Cart.findOne({ guestToken });
      
      if (!cart) return res.status(404).json({ msg: 'Carrinho não encontrado' });
      
      cart.products = [];
      await cart.save();
      return res.json(cart);
    }
    
    res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao limpar carrinho' });
  }
};

// Atualizar quantidade de produto no carrinho
const updateQuantity = async (req, res) => {
  const { productId, quantity, guestToken } = req.body;
  
  try {
    // Validar quantidade
    if (!quantity || quantity < 1) {
      return res.status(400).json({ msg: 'Quantidade deve ser maior que 0' });
    }
    
    let cart;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      cart = await Cart.findOne({ user: decoded.id });
      
      if (!cart) return res.status(404).json({ msg: 'Carrinho não encontrado' });

      const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
      if (productIndex === -1) {
        return res.status(404).json({ msg: 'Produto não encontrado no carrinho' });
      }
      
      cart.products[productIndex].quantity = quantity;
      await cart.save();
      
      // Retornar carrinho populado
      await cart.populate('products.product');
      return res.json(cart);
    } else if (guestToken) {
      cart = await Cart.findOne({ guestToken });
      
      if (!cart) return res.status(404).json({ msg: 'Carrinho não encontrado' });

      const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
      if (productIndex === -1) {
        return res.status(404).json({ msg: 'Produto não encontrado no carrinho' });
      }
      
      cart.products[productIndex].quantity = quantity;
      await cart.save();
      
      // Retornar carrinho populado
      await cart.populate('products.product');
      return res.json(cart);
    }
    
    res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao atualizar quantidade do produto' });
  }
};

// Adicionar participante ao carrinho
const addParticipant = async (req, res) => {
  const { name, guestToken } = req.body;
  
  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ msg: 'Nome do participante é obrigatório' });
    }

    let cart;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      cart = await Cart.findOne({ user: decoded.id });
      
      if (!cart) {
        cart = new Cart({ user: decoded.id, participants: [] });
      }
    } else if (guestToken) {
      cart = await Cart.findOne({ guestToken });
      
      if (!cart) {
        cart = new Cart({ guestToken, participants: [] });
      }
    } else {
      return res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
    }

    // Verificar se o participante já existe
    const participantName = name.trim();
    if (cart.participants.includes(participantName)) {
      return res.status(400).json({ msg: 'Participante já foi adicionado' });
    }

    cart.participants.push(participantName);
    await cart.save();
    await cart.populate('products.product');
    
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao adicionar participante' });
  }
};

// Remover participante do carrinho
const removeParticipant = async (req, res) => {
  const { name, guestToken } = req.body;
  
  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ msg: 'Nome do participante é obrigatório' });
    }

    let cart;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      cart = await Cart.findOne({ user: decoded.id });
    } else if (guestToken) {
      cart = await Cart.findOne({ guestToken });
    } else {
      return res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
    }

    if (!cart) {
      return res.status(404).json({ msg: 'Carrinho não encontrado' });
    }

    const participantName = name.trim();
    const initialLength = cart.participants.length;
    cart.participants = cart.participants.filter(participant => participant !== participantName);
    
    if (cart.participants.length === initialLength) {
      return res.status(404).json({ msg: 'Participante não encontrado' });
    }

    await cart.save();
    await cart.populate('products.product');
    
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao remover participante' });
  }
};

// Listar participantes do carrinho
const getParticipants = async (req, res) => {
  try {
    let cart;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      cart = await Cart.findOne({ user: decoded.id });
    } else if (req.query.guestToken) {
      cart = await Cart.findOne({ guestToken: req.query.guestToken });
    } else {
      return res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
    }

    const participants = cart ? cart.participants : [];
    res.json({ participants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao buscar participantes' });
  }
};

// Finalizar compra - Checkout com Mercado Pago
const checkout = async (req, res) => {
  try {
    let cart;
    
    // Obter carrinho (usuário ou convidado)
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      cart = await Cart.findOne({ user: decoded.id }).populate('products.product');
    } else if (req.body.guestToken || req.query.guestToken) {
      const guestToken = req.body.guestToken || req.query.guestToken;
      cart = await Cart.findOne({ guestToken }).populate('products.product');
    } else {
      return res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
    }

    if (!cart || !cart.products || cart.products.length === 0) {
      return res.status(400).json({ msg: 'Carrinho vazio' });
    }

    if (!cart.participants || cart.participants.length === 0) {
      return res.status(400).json({ msg: 'É necessário ter pelo menos um participante no carrinho' });
    }

    // Calcular valor total do carrinho
    let totalValue = 0;
    const items = [];

    for (const cartItem of cart.products) {
      const product = cartItem.product;
      const quantity = cartItem.quantity;
      const itemTotal = product.price * quantity;
      totalValue += itemTotal;

      items.push({
        id: product._id.toString(),
        title: product.name,
        description: product.description || '',
        picture_url: product.image || '',
        category_id: product.category || 'cha_de_bebe',
        quantity: quantity,
        currency_id: 'BRL',
        unit_price: product.price
      });
    }

    // Calcular valor por participante
    const valuePerParticipant = totalValue / cart.participants.length;
    const minValuePerParticipant = 100; // R$ 100,00 mínimo por participante

    // Verificar se cada participante contribui com pelo menos R$ 100
    if (valuePerParticipant < minValuePerParticipant) {
      return res.status(400).json({ 
        msg: `Valor por participante deve ser de pelo menos R$ ${minValuePerParticipant.toFixed(2)}. Valor atual: R$ ${valuePerParticipant.toFixed(2)}`,
        valuePerParticipant: valuePerParticipant.toFixed(2),
        minValueRequired: minValuePerParticipant,
        totalValue: totalValue.toFixed(2),
        participantsCount: cart.participants.length
      });
    }

    // Configurar cliente do Mercado Pago
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return res.status(500).json({ msg: 'Token do Mercado Pago não configurado' });
    }

    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      options: { timeout: 5000 }
    });

    const preference = new Preference(client);

    // Criar preferência de pagamento
    const preferenceData = {
      items: items,
      payer: {
        name: "Organizador do Chá",
        email: "organizador@chadebebe.com"
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success`,
        failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/failure`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/pending`
      },
      auto_return: "approved",
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12
      },
      notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/cart/webhook`,
      statement_descriptor: "CHA DE BEBE",
      external_reference: cart._id.toString(),
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      metadata: {
        cart_id: cart._id.toString(),
        participants: cart.participants,
        participants_count: cart.participants.length,
        value_per_participant: valuePerParticipant.toFixed(2)
      }
    };

    const response = await preference.create({ body: preferenceData });

    // Resposta de sucesso
    res.json({
      success: true,
      checkout_url: response.init_point,
      sandbox_checkout_url: response.sandbox_init_point,
      preference_id: response.id,
      total_value: totalValue.toFixed(2),
      participants_count: cart.participants.length,
      value_per_participant: valuePerParticipant.toFixed(2),
      participants: cart.participants,
      items: items.map(item => ({
        name: item.title,
        quantity: item.quantity,
        price: item.unit_price,
        total: (item.quantity * item.unit_price).toFixed(2)
      }))
    });

  } catch (error) {
    console.error('Erro no checkout:', error);
    
    if (error.message?.includes('MercadoPago')) {
      return res.status(500).json({ 
        msg: 'Erro na integração com Mercado Pago',
        error: error.message
      });
    }

    res.status(500).json({ 
      msg: 'Erro interno do servidor no checkout',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }
};

// Webhook do Mercado Pago para notificações de pagamento
const webhook = async (req, res) => {
  try {
    const { action, data } = req.body;
    
    console.log('Webhook recebido:', { action, data });
    
    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data.id;
      
      // Aqui você pode implementar a lógica para verificar o status do pagamento
      // e atualizar o status do pedido/carrinho conforme necessário
      
      console.log(`Pagamento ${action}: ${paymentId}`);
      
      // Exemplo de como você pode buscar informações do pagamento:
      // const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
      // const payment = new Payment(client);
      // const paymentInfo = await payment.get({ id: paymentId });
      
      res.status(200).json({ received: true });
    } else {
      res.status(200).json({ received: true, action: 'not_handled' });
    }
    
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro interno no webhook' });
  }
};

module.exports = {
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
};
