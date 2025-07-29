const multer = require('multer');

// Configuração do multer para armazenar em memória
const storage = multer.memoryStorage();

// Middleware do multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Aumento para 10MB
    fieldSize: 10 * 1024 * 1024, // Limite para campos de texto
    fields: 20, // Número máximo de campos não-arquivo
    files: 1 // Número máximo de arquivos
  },
  fileFilter: (req, file, cb) => {
    // Verificar se é uma imagem
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
    }
  }
});

module.exports = upload;
