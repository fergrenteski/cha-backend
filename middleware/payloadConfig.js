// Middleware para configurar limites de payload específicos para upload
const configureUploadLimits = (req, res, next) => {
  // Configurar headers específicos para upload
  res.set('Connection', 'keep-alive');
  res.set('Keep-Alive', 'timeout=5, max=1000');
  
  next();
};

module.exports = configureUploadLimits;
