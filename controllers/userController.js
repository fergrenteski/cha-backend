const User = require('../models/User');

// Obter perfil do usuário
const getAllUsers = async (req, res) => {
    try {
        console.log('Buscando todos os usuários...');
        
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        
        console.log(`${users.length} usuários encontrados`);
        
        res.status(200).json({
            users,
            count: users.length
        });
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        res.status(500).json({ 
            msg: 'Erro ao buscar usuários',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Alterna Admin
const toggleAdmin = async (req, res) => {
    try {
        const userId = req.params.id;
        
        console.log(`Tentando alterar privilégios para usuário ID: ${userId}`);

        // Validar ID do usuário
        if (!userId?.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: 'ID de usuário inválido' });
        }

        // Buscar o valor atual de isAdmin
        const userDoc = await User.findById(userId).select('isAdmin');
        if (!userDoc) {
            console.log(`Usuário não encontrado: ${userId}`);
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        console.log(`Usuário atual - isAdmin: ${userDoc.isAdmin}`);

        // Alternar o valor
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { isAdmin: !userDoc.isAdmin },
            { new: true }
        ).select('-password');

        console.log(`Usuário atualizado - isAdmin: ${updatedUser.isAdmin}`);

        const successMessage = `Usuário ${!userDoc.isAdmin ? 'promovido a' : 'removido de'} administrador com sucesso`;
        
        res.status(200).json({
            msg: successMessage,
            user: updatedUser
        });

    } catch (err) {
        console.error('Erro ao alterar privilégios de admin:', err);
        res.status(500).json({ 
            msg: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Excluir usuário
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        console.log(`Tentando excluir usuário ID: ${userId}`);

        // Validar ID do usuário
        if (!userId?.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: 'ID de usuário inválido' });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            console.log(`Usuário não encontrado para exclusão: ${userId}`);
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        console.log(`Usuário excluído com sucesso: ${user.email}`);
        
        res.status(200).json({ 
            msg: 'Usuário excluído com sucesso',
            deletedUser: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        console.error('Erro ao excluir usuário:', err);
        res.status(500).json({ 
            msg: 'Erro ao excluir usuário',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

module.exports = {
    getAllUsers,
    deleteUser,
    toggleAdmin
};
