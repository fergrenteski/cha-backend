const mongoose = require('mongoose');

const FavoritesSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  guestToken: { type: String },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    addedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Índice para busca rápida por usuário ou guestToken
FavoritesSchema.index({ user: 1 });
FavoritesSchema.index({ guestToken: 1 });

module.exports = mongoose.model('Favorites', FavoritesSchema);
