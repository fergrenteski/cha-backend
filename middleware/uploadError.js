const multer = require('multer');

// Middleware para tratar erros de upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        msg: 'Arquivo muito grande. Tamanho máximo: 10MB',
        error: 'PAYLOAD_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FIELD_SIZE') {
      return res.status(413).json({ 
        msg: 'Dados do formulário muito grandes',
        error: 'FIELD_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        msg: 'Muitos arquivos. Máximo: 1 arquivo',
        error: 'TOO_MANY_FILES'
      });
    }
    return res.status(400).json({ 
      msg: 'Erro no upload do arquivo',
      error: err.message 
    });
  }
  
  if (err.message === 'Apenas arquivos de imagem são permitidos!') {
    return res.status(400).json({ 
      msg: 'Apenas arquivos de imagem são permitidos!',
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  next(err);
};

module.exports = handleUploadError;
