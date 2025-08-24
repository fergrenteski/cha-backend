const mongoose = require('mongoose');
const { forceReconnect } = require('./mongoHealth');

// Wrapper para executar operações MongoDB com retry automático
const executeWithRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar se a conexão está ativa
      if (mongoose.connection.readyState !== 1) {
        console.log(`Conexão não ativa. Tentando reconectar... (tentativa ${attempt})`);
        await forceReconnect();
      }
      
      // Executar a operação
      const result = await operation();
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`Operação falhou na tentativa ${attempt}:`, error.message);
      
      // Se é erro de conexão, tentar reconectar
      if (error.name === 'MongooseError' || error.message.includes('buffering timed out')) {
        console.log('Erro de conexão detectado. Forçando reconexão...');
        await forceReconnect();
      }
      
      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  // Se chegou até aqui, todas as tentativas falharam
  throw new Error(`Operação falhou após ${maxRetries} tentativas. Último erro: ${lastError.message}`);
};

// Middleware para wrappear automaticamente operações do controller
const withRetry = (controllerFunction) => {
  return async (req, res, next) => {
    try {
      await executeWithRetry(async () => {
        return await controllerFunction(req, res, next);
      });
    } catch (error) {
      console.error('Erro após todas as tentativas:', error);
      res.status(500).json({
        msg: 'Erro interno do servidor. Tente novamente em alguns segundos.',
        error: 'operation_failed_after_retries'
      });
    }
  };
};

module.exports = {
  executeWithRetry,
  withRetry
};
