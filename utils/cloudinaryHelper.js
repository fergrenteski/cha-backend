const cloudinary = require('../config/cloudinary');

/**
 * Faz upload de uma imagem para o Cloudinary
 * @param {Buffer} buffer - Buffer da imagem
 * @param {string} folder - Pasta no Cloudinary (opcional)
 * @param {string} publicId - ID público customizado (opcional)
 * @returns {Promise<string>} - URL da imagem no Cloudinary
 */
const uploadImage = (buffer, folder = 'cha-products', publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      transformation: [
        { 
          width: 800, 
          height: 600, 
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto'
        }
      ],
      resource_type: 'image',
      timeout: 60000 // 60 segundos de timeout
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Erro no upload para Cloudinary:', error);
          reject(new Error(`Falha no upload: ${error.message}`));
        } else {
          console.log('Upload realizado com sucesso:', result.public_id);
          resolve(result.secure_url);
        }
      }
    ).end(buffer);
  });
};

/**
 * Deleta uma imagem do Cloudinary
 * @param {string} imageUrl - URL da imagem no Cloudinary
 * @returns {Promise<void>}
 */
const deleteImage = async (imageUrl) => {
  try {
    // Extrair o public_id da URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = `cha-products/${filename.split('.')[0]}`;
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Imagem deletada do Cloudinary:', publicId, result);
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    // Não rejeitar para não quebrar o fluxo principal
  }
};

module.exports = {
  uploadImage,
  deleteImage
};
