const User = require('../models/User');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

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
        
        // Verificar pedidos e participantes para cada usuário
        const usersWithConfirmedStatus = await Promise.all(
            users.map(async (user) => {
                const userObj = user.toObject();
                
                // Buscar todos os pedidos do usuário (para verificar confirmação)
                const userOrders = await Order.find({ user: user._id });
                
                // Buscar carrinho do usuário (para participantes ativos)
                const userCart = await Cart.findOne({ user: user._id });
                
                // Verificar se usuário está confirmado
                let isUserConfirmed = false;
                for (const order of userOrders) {
                    if (order.status === 'completed') {
                        const totalParticipants = (order.participants?.length || 0) + 1;
                        const valuePerParticipant = order.totalAmount / totalParticipants;
                        if (valuePerParticipant >= 100) {
                            isUserConfirmed = true;
                            break;
                        }
                    }
                }
                
                // Coletar participantes únicos do usuário
                const userParticipantsMap = new Map();
                
                // Participantes do carrinho ativo
                if (userCart?.participants) {
                    userCart.participants.forEach(participantName => {
                        userParticipantsMap.set(participantName, {
                            name: participantName,
                            confirmed: false,
                            source: 'cart'
                        });
                    });
                }
                
                // Participantes dos pedidos e verificar confirmação
                userOrders.forEach(order => {
                    if (order.participants) {
                        order.participants.forEach(participantName => {
                            const totalParticipants = (order.participants?.length || 0) + 1;
                            const valuePerParticipant = order.totalAmount / totalParticipants;
                            const isConfirmed = order.status === 'completed' && valuePerParticipant >= 100;
                            
                            if (userParticipantsMap.has(participantName)) {
                                // Atualizar confirmação se já existe
                                const existing = userParticipantsMap.get(participantName);
                                userParticipantsMap.set(participantName, {
                                    ...existing,
                                    confirmed: existing.confirmed || isConfirmed,
                                    source: existing.source === 'cart' ? 'both' : 'order'
                                });
                            } else {
                                // Adicionar novo participante
                                userParticipantsMap.set(participantName, {
                                    name: participantName,
                                    confirmed: isConfirmed,
                                    source: 'order'
                                });
                            }
                        });
                    }
                });
                
                // Converter Map para Array
                const userParticipants = Array.from(userParticipantsMap.values());
                
                return {
                    ...userObj,
                    confirmed: isUserConfirmed,
                    participants: userParticipants
                };
            })
        );
        
        // Contar total de usuários
        const totalUsers = await User.countDocuments(filter);
        
        // Calcular total de participantes únicos
        const totalParticipants = usersWithConfirmedStatus.reduce((total, user) => 
            total + user.participants.length, 0
        );
        
        console.log(`${usersWithConfirmedStatus.length} usuários encontrados (${totalUsers} total)`);
        console.log(`${totalParticipants} participantes associados aos usuários`);
        
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
