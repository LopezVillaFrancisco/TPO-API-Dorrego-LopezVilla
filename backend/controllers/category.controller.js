const CategoryService = require('../services/category.service');

const getCategories = async (req, res) => {
  try {
    const categories = await CategoryService.getCategories();
    return res.status(200).json({ status: 200, data: categories });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const category = await CategoryService.createCategory(req.body);
    return res.status(201).json({ status: 201, data: category, message: 'Categoría creada correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await CategoryService.updateCategory(req.params.id, req.body);
    return res.status(200).json({ status: 200, data: category, message: 'Categoría actualizada correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await CategoryService.deleteCategory(req.params.id);
    return res.status(200).json({ status: 200, message: 'Categoría eliminada correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
