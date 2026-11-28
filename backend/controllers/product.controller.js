const ProductService = require('../services/product.service');
const { asyncHandler } = require('../utils/http');

const getProducts = asyncHandler(async (req) => ({
  data: await ProductService.getProducts({ search: req.query.search, categoryId: req.query.category_id }),
}));

const getProductById = asyncHandler(async (req) => ({ data: await ProductService.getProductById(req.params.id) }));

const createProduct = asyncHandler(async (req) => ({
  status: 201,
  data: await ProductService.createProduct(req.body),
  message: 'Producto creado correctamente',
}));

const updateProduct = asyncHandler(async (req) => ({
  data: await ProductService.updateProduct(req.params.id, req.body),
  message: 'Producto actualizado correctamente',
}));

const deleteProduct = asyncHandler(async (req) => {
  await ProductService.deleteProduct(req.params.id);
  return { message: 'Producto eliminado correctamente' };
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
