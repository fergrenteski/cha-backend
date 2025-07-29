const User = require('../models/User');

// Obter perfil do usuário
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao buscar perfil' });
  }
};

// Atualizar perfil
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      req.body, 
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ msg: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao atualizar perfil' });
  }
};

// Excluir usuário
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Usuário não encontrado' });
    res.json({ msg: 'Usuário excluído' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao excluir usuário' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteUser
};
