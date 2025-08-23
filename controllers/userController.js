const User = require('../models/User');

// Obter perfil do usuário
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        if (!users) return res.status(404).json({ msg: 'Não possui usuários' });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Erro ao buscar perfil' });
    }
};

// Alterna Admin
const toggleAdmin = async (req, res) => {
    try {
        const userId = req.params.id;

        // Buscar o valor atual de isAdmin
        const userDoc = await User.findById(userId).select('isAdmin');
        if (!userDoc) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        // Alternar o valor
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { isAdmin: !userDoc.isAdmin },
            { new: true }
        ).select('-password');

        res.json({
            msg: `Usuário ${!userDoc.isAdmin ? 'promovido a' : 'removido de'} administrador com sucesso`,
            user: updatedUser
        });

    } catch (err) {
        console.error('Erro ao alterar privilégios de admin:', err);
        res.status(500).json({ msg: 'Erro interno do servidor' });
    }
};

// Excluir usuário
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Usuário não encontrado' });
        res.json({ msg: 'Usuário excluído' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Erro ao excluir usuário' });
    }
};

module.exports = {
    getAllUsers,
    deleteUser,
    toggleAdmin
};
