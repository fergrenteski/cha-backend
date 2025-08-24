// Script para criar índices otimizados no MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

const optimizeDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB para otimização...');

    const db = mongoose.connection.db;

    // Índices para Products
    await db.collection('products').createIndex({ name: 'text', description: 'text' });
    await db.collection('products').createIndex({ category: 1, available: 1 });
    await db.collection('products').createIndex({ available: 1, createdAt: -1 });
    await db.collection('products').createIndex({ price: 1 });
    
    // Índices para Cart
    await db.collection('carts').createIndex({ user: 1 });
    await db.collection('carts').createIndex({ guestToken: 1 });
    await db.collection('carts').createIndex({ "products.product": 1 });

    // Índices para Favorites
    await db.collection('favorites').createIndex({ user: 1 });
    await db.collection('favorites').createIndex({ guestToken: 1 });
    await db.collection('favorites').createIndex({ "products.product": 1 });

    // Índices para Orders
    await db.collection('orders').createIndex({ user: 1, createdAt: -1 });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ orderNumber: 1 });

    // Índices para Users
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    console.log('✅ Índices criados com sucesso!');
    
    // Verificar estatísticas das coleções
    const collections = ['products', 'carts', 'favorites', 'orders', 'users'];
    
    for (const collection of collections) {
      const stats = await db.collection(collection).stats();
      console.log(`📊 ${collection}: ${stats.count} documentos, ${Math.round(stats.size / 1024)} KB`);
    }

  } catch (error) {
    console.error('❌ Erro ao otimizar database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  optimizeDatabase();
}

module.exports = optimizeDatabase;
