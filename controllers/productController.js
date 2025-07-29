const Product = require('../models/Product');
const { uploadImage, deleteImage } = require('../utils/cloudinaryHelper');

// Listar todos os produtos
const getAllProducts = async (req, res) => {
  try {
    const { category, available, search } = req.query;
    let filter = {};
    
    // Filtro por categoria
    if (category) {
      filter.category = category;
    }
    
    // Filtro por disponibilidade
    if (available !== undefined) {
      filter.available = available === 'true';
    }
    
    // Busca por nome ou descrição
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao buscar produtos' });
  }
};

// Buscar produto por ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao buscar produto' });
  }
};

// Criar produto
const createProduct = async (req, res) => {
  try {
    const { name, description, price, capacity, category, available, stock } = req.body;
    
    // Validar campos obrigatórios
    if (!name || !description || !price || !capacity || !category) {
      return res.status(400).json({ 
        msg: 'Campos obrigatórios: name, description, price, capacity, category' 
      });
    }

    let imageUrl = '';
    
    // Se foi enviada uma imagem, fazer upload para o Cloudinary
    if (req.file) {
      try {
        imageUrl = await uploadImage(req.file.buffer);
      } catch (uploadError) {
        console.error('Erro no upload da imagem:', uploadError);
        return res.status(500).json({ msg: 'Erro ao fazer upload da imagem' });
      }
    }

    // Criar produto com dados do formulário
    const productData = {
      name,
      description,
      price: parseFloat(price),
      capacity,
      category,
      available: available === 'true' || available === true,
      stock: stock ? parseInt(stock) : 0,
      image: imageUrl
    };

    const product = new Product(productData);
    await product.save();
    
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: 'Dados inválidos', errors: err.errors });
    }
    res.status(500).json({ msg: 'Erro ao criar produto' });
  }
};

// Atualizar produto
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, capacity, category, available, stock } = req.body;
    
    // Buscar o produto atual
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({ msg: 'Produto não encontrado' });
    }

    // Preparar dados para atualização
    const updateData = {};
    
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (capacity) updateData.capacity = capacity;
    if (category) updateData.category = category;
    if (available !== undefined) updateData.available = available === 'true' || available === true;
    if (stock !== undefined) updateData.stock = parseInt(stock);

    // Se foi enviada uma nova imagem
    if (req.file) {
      try {
        // Fazer upload da nova imagem
        const newImageUrl = await uploadImage(req.file.buffer);
        updateData.image = newImageUrl;
        
        // Deletar a imagem antiga se existir
        if (currentProduct.image) {
          await deleteImage(currentProduct.image);
        }
      } catch (uploadError) {
        console.error('Erro no upload da nova imagem:', uploadError);
        return res.status(500).json({ msg: 'Erro ao fazer upload da nova imagem' });
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    res.json(product);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: 'Dados inválidos', errors: err.errors });
    }
    res.status(500).json({ msg: 'Erro ao atualizar produto' });
  }
};

// Excluir produto
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Produto não encontrado' });
    }
    
    // Deletar a imagem do Cloudinary se existir
    if (product.image) {
      await deleteImage(product.image);
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Produto excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao excluir produto' });
  }
};

// Obter categorias únicas
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Erro ao buscar categorias' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories
};
