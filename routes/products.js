const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const handleUploadError = require('../middleware/uploadError');
const configureUploadLimits = require('../middleware/payloadConfig');
const { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getCategories
} = require('../controllers/productController');

// Listar todos os produtos
router.get('/', getAllProducts);

// Obter categorias únicas
router.get('/categories', getCategories);

// Buscar produto por ID
router.get('/:id', getProductById);

// Criar produto
router.post('/', configureUploadLimits, upload.single('image'), handleUploadError, createProduct);

// Atualizar produto
router.put('/:id', configureUploadLimits, upload.single('image'), handleUploadError, updateProduct);

// Excluir produto
router.delete('/:id', auth, deleteProduct);

module.exports = router;
