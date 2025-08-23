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
    }
    
    res.json(favorites || { products: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao buscar favoritos' });
  }
};

// Adicionar produto aos favoritos
const addToFavorites = async (req, res) => {
  const { productId } = req.body;
  
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
    } else {
      return res.status(400).json({ msg: 'Usuário obrigatório' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao adicionar aos favoritos' });
  }
};

// Remover produto dos favoritos
const removeFromFavorites = async (req, res) => {
  const { productId } = req.body;
  
  try {
    let favorites;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      favorites = await Favorites.findOne({ user: decoded.id });
    } else {
      return res.status(400).json({ msg: 'Usuário obrigatório' });
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
  
  try {
    let favorites;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      favorites = await Favorites.findOne({ user: decoded.id });
    } else {
      return res.status(400).json({ msg: 'Usuário obrigatório' });
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
  
  try {
    let favorites;
    
    if (req.header('Authorization')) {
      const token = req.header('Authorization').replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      favorites = await Favorites.findOne({ user: decoded.id });
    } else {
      return res.status(400).json({ msg: 'Usuário obrigatório' });
    }

    const isFavorite = favorites ? favorites.products.some(p => p.product.toString() === productId) : false;
    
    res.json({ isFavorite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao verificar favorito' });
  }
};

module.exports = {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  clearFavorites,
  isProductInFavorites,
};
