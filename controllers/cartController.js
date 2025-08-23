const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
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

// Migrar carrinho de convidado para usuário logado
const migrateGuestCart = async (req, res) => {
  const { guestToken } = req.body;
  
  try {
    if (!guestToken) {
      return res.status(400).json({ msg: 'Token de convidado obrigatório' });
    }

    // Verificar se há um token de autorização válido
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'Token de autenticação obrigatório' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Buscar carrinho do convidado
    const guestCart = await Cart.findOne({ guestToken }).populate('products.product');
    
    if (!guestCart || guestCart.products.length === 0) {
      return res.json({ msg: 'Nenhum carrinho de convidado para migrar', cart: null });
    }

    // Buscar ou criar carrinho do usuário
    let userCart = await Cart.findOne({ user: userId });
    
    if (!userCart) {
      // Se não existe carrinho do usuário, converter o carrinho do convidado
      guestCart.user = userId;
      guestCart.guestToken = undefined;
      await guestCart.save();
      userCart = guestCart;
    } else {
      // Se já existe carrinho do usuário, mesclar os produtos
      for (const guestProduct of guestCart.products) {
        const existingProductIndex = userCart.products.findIndex(
          p => p.product.toString() === guestProduct.product._id.toString()
        );
        
        if (existingProductIndex > -1) {
          // Produto já existe, somar as quantidades
          userCart.products[existingProductIndex].quantity += guestProduct.quantity;
        } else {
          // Produto não existe, adicionar ao carrinho
          userCart.products.push({
            product: guestProduct.product._id,
            quantity: guestProduct.quantity
          });
        }
      }

      // Mesclar participantes se houver
      if (guestCart.participants && guestCart.participants.length > 0) {
        const uniqueParticipants = [...new Set([...userCart.participants, ...guestCart.participants])];
        userCart.participants = uniqueParticipants;
      }

      await userCart.save();
      
      // Remover carrinho do convidado
      await Cart.findByIdAndDelete(guestCart._id);
    }

    // Retornar o carrinho atualizado com produtos populados
    await userCart.populate('products.product');
    
    res.json({ 
      msg: 'Carrinho migrado com sucesso', 
      cart: userCart 
    });
  } catch (err) {
    console.error('Erro ao migrar carrinho:', err);
    res.status(500).json({ msg: 'Erro ao migrar carrinho' });
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
  migrateGuestCart
};
