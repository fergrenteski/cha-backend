const User = require('../models/User');

// Middleware para verificar se o usuário é administrador
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id; // Vem do middleware de auth
    
    const user = await User.findById(userId).select('isAdmin');
    
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    
    if (!user.isAdmin) {
      return res.status(403).json({ 
        msg: 'Acesso negado. Apenas administradores podem realizar esta ação.',
        required: 'admin_privileges'
      });
    }
    
    // Se chegou até aqui, o usuário é admin
    next();
  } catch (error) {
    console.error('Erro ao verificar privilégios de admin:', error);
    res.status(500).json({ 
      msg: 'Erro ao verificar privilégios',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware para prevenir que admin se remova como admin
const preventSelfDemotion = (req, res, next) => {
  const currentUserId = req.user.id;
  const targetUserId = req.params.id;
  
  if (currentUserId === targetUserId) {
    return res.status(400).json({ 
      msg: 'Você não pode remover seus próprios privilégios de administrador',
      code: 'self_demotion_prevented'
    });
  }
  
  next();
};

module.exports = {
  requireAdmin,
  preventSelfDemotion
};
