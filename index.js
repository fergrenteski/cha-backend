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

// Configuração otimizada do MongoDB para Vercel
const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    // Configurações específicas para Vercel serverless
    const opts = {
      bufferCommands: false, // Crítico: desabilitar buffering no Vercel
      maxPoolSize: 5,        // Reduzir pool para serverless
      minPoolSize: 1,        // Manter pelo menos 1 conexão
      serverSelectionTimeoutMS: 10000, // 10s para seleção do servidor
      socketTimeoutMS: 20000,          // 20s para operações socket
      connectTimeoutMS: 10000,         // 10s para conectar
      maxIdleTimeMS: 30000,            // 30s antes de fechar conexão idle
      heartbeatFrequencyMS: 10000,     // Heartbeat a cada 10s
      retryWrites: true,
      retryReads: true
    };
    
    // Desconectar conexão anterior se existir
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
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

// Middleware para conectar ao DB com retry
app.use(async (req, res, next) => {
  let retries = 3;
  
  while (retries > 0) {
    try {
      // Verificar se a conexão está ativa
      if (mongoose.connection.readyState !== 1) {
        await connectDB();
      }
      return next();
    } catch (error) {
      console.error(`Tentativa de conexão falhou. Tentativas restantes: ${retries - 1}`, error.message);
      retries--;
      
      if (retries === 0) {
        console.error('Falha ao conectar ao MongoDB após 3 tentativas');
        return res.status(503).json({ 
          msg: 'Serviço temporariamente indisponível. Tente novamente em alguns segundos.',
          error: 'database_connection_failed'
        });
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

// Middleware de compressão e otimização
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Só validar JSON se houver conteúdo no buffer
    if (buf && buf.length > 0) {
      try {
        JSON.parse(buf);
      } catch (e) {
        console.error('JSON inválido recebido:', buf.toString());
        res.status(400).json({ msg: 'JSON inválido' });
        return;
      }
    }
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint com verificação de MongoDB
app.get('/health', async (req, res) => {
  try {
    const { checkMongoHealth } = require('./utils/mongoHealth');
    const mongoHealth = await checkMongoHealth();
    
    res.status(mongoHealth.status === 'healthy' ? 200 : 503).json({ 
      status: mongoHealth.status === 'healthy' ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      database: mongoHealth
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/user'));

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
