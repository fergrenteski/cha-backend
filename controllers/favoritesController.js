const Favorites = require('../models/Favorites');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

// Obter favoritos (usuário ou convidado)
const getFavorites = async (req, res) => {
  try {
    let favorites;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      favorites = await Favorites.findOne({ user: decoded.id }).populate('products.product');
    } else if (req.query.guestToken) {
      favorites = await Favorites.findOne({ guestToken: req.query.guestToken }).populate('products.product');
    }
    
    res.json(favorites || { products: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao buscar favoritos' });
  }
};

// Adicionar produto aos favoritos
const addToFavorites = async (req, res) => {
  const { productId, guestToken } = req.body;
  
  try {
    // Verificar se o produto existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Produto não encontrado' });
    }

    let favorites;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      favorites = await Favorites.findOne({ user: decoded.id }) || new Favorites({ user: decoded.id });
      
      // Verificar se o produto já está nos favoritos
      const productExists = favorites.products.some(p => p.product.toString() === productId);
      if (productExists) {
        return res.status(400).json({ msg: 'Produto já está nos favoritos' });
      }
      
      favorites.products.push({ product: productId });
      await favorites.save();
      await favorites.populate('products.product');
      return res.json(favorites);
    } else if (guestToken) {
      favorites = await Favorites.findOne({ guestToken }) || new Favorites({ guestToken });
      
      // Verificar se o produto já está nos favoritos
      const productExists = favorites.products.some(p => p.product.toString() === productId);
      if (productExists) {
        return res.status(400).json({ msg: 'Produto já está nos favoritos' });
      }
      
      favorites.products.push({ product: productId });
      await favorites.save();
      await favorites.populate('products.product');
      return res.json(favorites);
    } else {
      return res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao adicionar aos favoritos' });
  }
};

// Remover produto dos favoritos
const removeFromFavorites = async (req, res) => {
  const { productId, guestToken } = req.body;
  
  try {
    let favorites;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      favorites = await Favorites.findOne({ user: decoded.id });
    } else if (guestToken) {
      favorites = await Favorites.findOne({ guestToken });
    } else {
      return res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
    }

    if (!favorites) {
      return res.status(404).json({ msg: 'Favoritos não encontrados' });
    }

    const initialLength = favorites.products.length;
    favorites.products = favorites.products.filter(p => p.product.toString() !== productId);
    
    if (favorites.products.length === initialLength) {
      return res.status(404).json({ msg: 'Produto não encontrado nos favoritos' });
    }

    await favorites.save();
    await favorites.populate('products.product');
    
    res.json(favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao remover dos favoritos' });
  }
};

// Limpar todos os favoritos
const clearFavorites = async (req, res) => {
  const { guestToken } = req.body;
  
  try {
    let favorites;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      favorites = await Favorites.findOne({ user: decoded.id });
    } else if (guestToken) {
      favorites = await Favorites.findOne({ guestToken });
    } else {
      return res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
    }

    if (!favorites) {
      return res.status(404).json({ msg: 'Favoritos não encontrados' });
    }

    favorites.products = [];
    await favorites.save();
    
    res.json({ msg: 'Favoritos limpos com sucesso', favorites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao limpar favoritos' });
  }
};

// Verificar se produto está nos favoritos
const isProductInFavorites = async (req, res) => {
  const { productId } = req.params;
  const { guestToken } = req.query;
  
  try {
    let favorites;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      favorites = await Favorites.findOne({ user: decoded.id });
    } else if (guestToken) {
      favorites = await Favorites.findOne({ guestToken });
    } else {
      return res.status(400).json({ msg: 'Usuário ou guestToken obrigatório' });
    }

    const isFavorite = favorites ? favorites.products.some(p => p.product.toString() === productId) : false;
    
    res.json({ isFavorite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao verificar favorito' });
  }
};

// Migrar favoritos de convidado para usuário logado
const migrateGuestFavorites = async (req, res) => {
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

    // Buscar favoritos do convidado
    const guestFavorites = await Favorites.findOne({ guestToken }).populate('products.product');
    
    if (!guestFavorites || guestFavorites.products.length === 0) {
      return res.json({ msg: 'Nenhum favorito de convidado para migrar', favorites: null });
    }

    // Buscar ou criar favoritos do usuário
    let userFavorites = await Favorites.findOne({ user: userId });
    
    if (!userFavorites) {
      // Se não existe favoritos do usuário, converter os favoritos do convidado
      guestFavorites.user = userId;
      guestFavorites.guestToken = undefined;
      await guestFavorites.save();
      userFavorites = guestFavorites;
    } else {
      // Se já existe favoritos do usuário, mesclar os produtos
      for (const guestProduct of guestFavorites.products) {
        const productExists = userFavorites.products.some(
          p => p.product.toString() === guestProduct.product._id.toString()
        );
        
        if (!productExists) {
          // Produto não existe nos favoritos, adicionar
          userFavorites.products.push({
            product: guestProduct.product._id,
            addedAt: guestProduct.addedAt
          });
        }
      }

      await userFavorites.save();
      
      // Remover favoritos do convidado
      await Favorites.findByIdAndDelete(guestFavorites._id);
    }

    // Retornar os favoritos atualizados com produtos populados
    await userFavorites.populate('products.product');
    
    res.json({ 
      msg: 'Favoritos migrados com sucesso', 
      favorites: userFavorites 
    });
  } catch (err) {
    console.error('Erro ao migrar favoritos:', err);
    res.status(500).json({ msg: 'Erro ao migrar favoritos' });
  }
};

module.exports = {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  clearFavorites,
  isProductInFavorites,
  migrateGuestFavorites
};
