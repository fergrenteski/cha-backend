const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  password: { type: String, required: true },
  isGuest: { type: Boolean, default: false },
  cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }]
});

module.exports = mongoose.model('User', UserSchema);
