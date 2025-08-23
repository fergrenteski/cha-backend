const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  products: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true
    },
    quantity: { 
      type: Number, 
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    productName: String, // Para manter histórico caso produto seja deletado
    productDescription: String, // Para manter histórico caso produto seja deletado
    productImage: String
  }],
  participants: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String,
  cancelReason: String,
  completedAt: Date
}, {
  timestamps: true
});

// Middleware para gerar número do pedido
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `PED${String(count + 1).padStart(6, '0')}`;
  }
  
  // Atualizar completedAt quando status for completed
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Índices para busca otimizada
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', OrderSchema);
