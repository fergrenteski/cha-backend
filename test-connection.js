// Teste rápido de conexão MongoDB para Vercel
require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🧪 Testando conexão MongoDB...');
    
    const opts = {
      bufferCommands: false,
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true
    };
    
    await mongoose.connect(process.env.MONGO_URI, opts);
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste de ping
    const pingResult = await mongoose.connection.db.admin().ping();
    console.log('🏓 Ping MongoDB:', pingResult);
    
    // Teste de operação simples
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Coleções encontradas:', collections.length);
    
    console.log('🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.name === 'MongoParseError') {
      console.error('💡 Erro de configuração. Verifique as opções do MongoDB.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado do MongoDB');
  }
};

// Executar teste
testConnection();
