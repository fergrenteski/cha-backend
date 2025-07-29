const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: String, required: true },
  image: { type: String, required: false }, // Imagem agora é opcional
  category: { type: String, required: true },
  available: { type: Boolean, default: true },
  stock: { type: Number, default: 0 }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

module.exports = mongoose.model('Product', ProductSchema);
