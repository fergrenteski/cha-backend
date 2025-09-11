const User = require('../models/User');
const Order = require('../models/Order');

// Obter perfil do usuário
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        
        console.log(`Buscando usuários - Página: ${page}, Limite: ${limit}, Busca: "${search}"`);
        
        // Construir filtro de busca
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Calcular paginação
        const skip = (page - 1) * limit;
        
        // Buscar usuários com paginação
        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Verificar pedidos concluídos para marcar usuários confirmados
        const usersWithConfirmedStatus = await Promise.all(
            users.map(async (user) => {
                const userObj = user.toObject();
                
                // Buscar pedidos concluídos do usuário
                const completedOrders = await Order.find({
                    user: user._id,
                    status: 'completed'
                });
                
                // Verificar se algum pedido tem mais de R$ 100 por participante
                let isConfirmed = false;
                
                for (const order of completedOrders) {
                    const totalParticipants = (order.participants?.length || 0) + 1; // +1 para incluir o próprio usuário
                    const valuePerParticipant = order.totalAmount / totalParticipants;
                    
                    if (valuePerParticipant >= 100) {
                        isConfirmed = true;
                        break;
                    }
                }
                
                return {
                    ...userObj,
                    confirmed: isConfirmed
                };
            })
        );
        
        // Contar total de usuários
        const totalUsers = await User.countDocuments(filter);
        
        console.log(`${usersWithConfirmedStatus.length} usuários encontrados (${totalUsers} total)`);
        
        res.status(200).json({
            users: usersWithConfirmedStatus,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                hasMore: skip + usersWithConfirmedStatus.length < totalUsers,
                count: usersWithConfirmedStatus.length
            }
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
