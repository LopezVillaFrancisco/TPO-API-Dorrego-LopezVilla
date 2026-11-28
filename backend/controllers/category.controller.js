const CategoryService = require('../services/category.service');
const { asyncHandler } = require('../utils/http');

const getCategories = asyncHandler(async () => ({ data: await CategoryService.getCategories() }));

const createCategory = asyncHandler(async (req) => ({
  status: 201,
  data: await CategoryService.createCategory(req.body),
  message: 'Categoría creada correctamente',
}));

const updateCategory = asyncHandler(async (req) => ({
  data: await CategoryService.updateCategory(req.params.id, req.body),
  message: 'Categoría actualizada correctamente',
}));

const deleteCategory = asyncHandler(async (req) => {
  await CategoryService.deleteCategory(req.params.id);
  return { message: 'Categoría eliminada correctamente' };
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
