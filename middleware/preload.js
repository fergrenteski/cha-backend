// Middleware para preload de dados críticos
const Product = require('../models/Product');

let cachedCategories = null;
let categoriesCacheTime = 0;
const CATEGORIES_CACHE_TTL = 15 * 60 * 1000; // 15 minutos

// Preload das categorias mais populares
const preloadCategories = async () => {
  try {
    if (!cachedCategories || Date.now() - categoriesCacheTime > CATEGORIES_CACHE_TTL) {
      cachedCategories = await Product.distinct('category');
      categoriesCacheTime = Date.now();
    }
    return cachedCategories;
  } catch (error) {
    console.error('Erro ao precarregar categorias:', error);
    return [];
  }
};

// Middleware para adicionar dados precarregados no contexto
const preloadMiddleware = async (req, res, next) => {
  // Adicionar categorias no contexto global para uso rápido
  if (!res.locals.categories) {
    res.locals.categories = await preloadCategories();
  }
  
  next();
};

// Função para aquecer o cache na inicialização
const warmupCache = async () => {
  try {
    console.log('🔥 Aquecendo cache...');
    await preloadCategories();
    console.log('✅ Cache aquecido com sucesso');
  } catch (error) {
    console.error('❌ Erro ao aquecer cache:', error);
  }
};

module.exports = {
  preloadMiddleware,
  preloadCategories,
  warmupCache
};
