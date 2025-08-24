// Middleware simples de logging para performance
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  // Override do método send para capturar quando a resposta é enviada
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log apenas em produção e para requests lentos (>1000ms)
    if (process.env.NODE_ENV === 'production' && duration > 1000) {
      console.log(`[SLOW REQUEST] ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);
    }
    
    // Log de erros
    if (res.statusCode >= 400) {
      console.log(`[ERROR] ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware para detectar memory leaks
const memoryMonitor = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const used = process.memoryUsage();
    
    // Log se uso de memória for alto (>800MB)
    if (used.heapUsed > 800 * 1024 * 1024) {
      console.log(`[HIGH MEMORY] Heap used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
    }
  }
  
  next();
};

module.exports = {
  requestLogger,
  memoryMonitor
};
