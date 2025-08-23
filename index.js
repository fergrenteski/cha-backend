require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Configuração CORS para liberar qualquer origem

const allowedOrigins = process.env.FRONTEND_URLS.split(',');

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // se estiver usando cookies ou auth com headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Configuração para aumentar o limite de payload
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
  })
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB Atlas:', err.message));

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
}

// Exportar para Vercel
module.exports = app;
