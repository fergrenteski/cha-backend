const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const handleUploadError = require('../middleware/uploadError');
const configureUploadLimits = require('../middleware/payloadConfig');
const { cacheMiddleware, clearCache } = require('../middleware/cache');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getCategories
} = require('../controllers/productController');

// Cache para produtos (5 minutos)
const productCache = cacheMiddleware(5 * 60 * 1000);

// Listar todos os produtos (com cache)
router.get('/', productCache, getAllProducts);

// Obter categorias únicas (com cache longo - 15 minutos)
router.get('/categories', cacheMiddleware(15 * 60 * 1000), getCategories);

// Buscar produto por ID (com cache)
router.get('/:id', cacheMiddleware(10 * 60 * 1000), getProductById);

// Criar produto
router.post('/', uploadLimiter, configureUploadLimits, upload.single('image'), handleUploadError, (req, res, next) => {
  // Limpar cache quando criar produto
  clearCache('/api/products');
  next();
}, createProduct);

// Atualizar produto
router.put('/:id', uploadLimiter, configureUploadLimits, upload.single('image'), handleUploadError, (req, res, next) => {
  // Limpar cache quando atualizar produto
  clearCache('/api/products');
  next();
}, updateProduct);

// Excluir produto
router.delete('/:id', (req, res, next) => {
  // Limpar cache quando deletar produto
  clearCache('/api/products');
  next();
}, deleteProduct);

module.exports = router;
