const express = require('express');
const router = express.Router();
const { 
  getFavorites, 
  addToFavorites, 
  removeFromFavorites, 
  clearFavorites,
  isProductInFavorites,
  migrateGuestFavorites
} = require('../controllers/favoritesController');
const auth = require('../middleware/auth');

// Obter favoritos (usuário ou convidado)
router.get('/', getFavorites);

// Verificar se produto está nos favoritos
router.get('/check/:productId', isProductInFavorites);

// Adicionar produto aos favoritos
router.post('/add', addToFavorites);

// Remover produto dos favoritos
router.post('/remove', removeFromFavorites);

// Limpar favoritos
router.post('/clear', clearFavorites);

// Migrar favoritos de convidado para usuário logado
router.post('/migrate', auth, migrateGuestFavorites);

module.exports = router;
