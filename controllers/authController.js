const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registro
const register = async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Usuário já existe' });
    
    user = new User({ 
      firstName,
      lastName,
      email,
      phone,
      password: await bcrypt.hash(password, 10) 
    });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err); 
    res.status(500).json({ msg: 'Erro no registro' });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Usuário não encontrado' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Senha incorreta' });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro no login' });
  }
};

// Registro de convidado
const createGuest = async (req, res) => {
  try {
    const guest = new User({ 
      firstName: 'Guest',
      lastName: 'User',
      email: `guest_${Date.now()}@mail.com`,
      phone: '',
      password: `guest_${Date.now()}`,
      isGuest: true 
    });
    await guest.save();
    
    const token = jwt.sign({ id: guest._id, guest: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao criar convidado' });
  }
};

module.exports = {
  register,
  login,
  createGuest
};
