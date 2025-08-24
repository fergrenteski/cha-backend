const mongoose = require('mongoose');

// Utilitário para verificar saúde da conexão MongoDB
const checkMongoHealth = async () => {
  try {
    // Verificar estado da conexão
    const state = mongoose.connection.readyState;
    const stateMessages = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (state !== 1) {
      throw new Error(`MongoDB não conectado. Estado: ${stateMessages[state]}`);
    }

    // Fazer ping no banco para verificar se está respondendo
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      state: stateMessages[state],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Middleware para verificar conexão antes de operações críticas
const ensureConnection = async (req, res, next) => {
  try {
    const health = await checkMongoHealth();
    
    if (health.status === 'unhealthy') {
      console.error('MongoDB health check failed:', health);
      return res.status(503).json({
        msg: 'Banco de dados temporariamente indisponível',
        error: 'database_unhealthy'
      });
    }
    
    next();
  } catch (error) {
    console.error('Connection check failed:', error);
    res.status(503).json({
      msg: 'Erro ao verificar conexão com banco de dados',
      error: 'connection_check_failed'
    });
  }
};

// Função para reconectar em caso de falha
const forceReconnect = async () => {
  try {
    console.log('Forçando reconexão ao MongoDB...');
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
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
    });
    
    console.log('✅ Reconexão bem-sucedida');
    return true;
  } catch (error) {
    console.error('❌ Falha na reconexão:', error);
    return false;
  }
};

module.exports = {
  checkMongoHealth,
  ensureConnection,
  forceReconnect
};
