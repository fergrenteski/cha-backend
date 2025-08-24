require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');
const { requestLogger, memoryMonitor } = require('./middleware/monitoring');

const app = express();

// Headers de segurança otimizados
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP para APIs
  crossOriginEmbedderPolicy: false, // Permitir embedding
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Cache da conexão MongoDB para evitar reconexões desnecessárias
let cachedConnection = null;

// Configuração otimizada do MongoDB
const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    
    cachedConnection = await mongoose.connect(process.env.MONGO_URI, opts);
    console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
    return cachedConnection;
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB Atlas:', err.message);
    throw err;
  }
};

// Configuração CORS otimizada
const allowedOrigins = process.env.FRONTEND_URLS.split(',');

// Middleware de compressão (deve vir antes de outros middlewares)
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // Comprimir apenas respostas > 1KB
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight por 24h
}));

// Rate limiting geral
app.use(generalLimiter);

// Middlewares de monitoramento
app.use(requestLogger);
app.use(memoryMonitor);

// Middleware para conectar ao DB apenas quando necessário
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ msg: 'Erro de conexão com banco de dados' });
  }
});

// Middleware de compressão e otimização
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Validação rápida do JSON
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ msg: 'JSON inválido' });
      return;
    }
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/orders', require('./routes/orders'));

app.options(/.*/, cors());

const PORT = process.env.PORT || 3001;

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  });
}

// Exportar para Vercel
module.exports = app;
