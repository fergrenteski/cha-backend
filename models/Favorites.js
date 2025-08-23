const mongoose = require('mongoose');

const FavoritesSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Índice para busca rápida por usuário
FavoritesSchema.index({ user: 1 });

module.exports = mongoose.model('Favorites', FavoritesSchema);
