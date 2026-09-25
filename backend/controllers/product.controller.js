const ProductService = require('../services/product.service');

const getProducts = async (req, res) => {
  try {
    const products = await ProductService.getProducts({
      search: req.query.search,
      categoryId: req.query.category_id,
    });
    return res.status(200).json({ status: 200, data: products });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    return res.status(200).json({ status: 200, data: product });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await ProductService.createProduct(req.body);
    return res.status(201).json({ status: 201, data: product, message: 'Producto creado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await ProductService.updateProduct(req.params.id, req.body);
    return res.status(200).json({ status: 200, data: product, message: 'Producto actualizado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await ProductService.deleteProduct(req.params.id);
    return res.status(200).json({ status: 200, message: 'Producto eliminado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
