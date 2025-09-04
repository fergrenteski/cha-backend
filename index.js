require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Configuração CORS simples
const allowedOrigins = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check simples
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
app.use('/api/users', require('./routes/user')); // Comentado temporariamente

app.options(/.*/, cors());

const PORT = process.env.PORT || 3001;

// Conectar ao MongoDB e só iniciar servidor após conexão
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout para seleção do servidor
      socketTimeoutMS: 45000, // Timeout para operações
    });
    console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
    
    // Para desenvolvimento local - só inicia após conectar
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
    }
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB Atlas:', err.message);
    process.exit(1); // Termina o processo se não conseguir conectar
  }
};

// Iniciar servidor
startServer();

// Exportar para Vercel
module.exports = app;
