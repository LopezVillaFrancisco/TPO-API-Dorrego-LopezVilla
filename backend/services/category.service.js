const Category = require('../models/Category.model');
const Product = require('../models/Product.model');

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const saveUnique = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw httpError(409, 'Ya existe una categoría con ese nombre');
    }
    throw error;
  }
};

const getCategories = async () => {
  return Category.findAll({ order: [['order', 'ASC'], ['name', 'ASC']] });
};

const createCategory = async ({ name, order }) => {
  if (!name) {
    throw httpError(400, 'El nombre es obligatorio');
  }

  const existing = await Category.findOne({ where: { name } });
  if (existing) {
    throw httpError(409, 'Ya existe una categoría con ese nombre');
  }

  return saveUnique(() => Category.create({ name, order }));
};

const updateCategory = async (id, { name, order }) => {
  const category = await Category.findByPk(id);
  if (!category) {
    throw httpError(404, 'Categoría no encontrada');
  }

  if (name !== undefined) category.name = name;
  if (order !== undefined) category.order = order;

  await saveUnique(() => category.save());
  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) {
    throw httpError(404, 'Categoría no encontrada');
  }

  const productsCount = await Product.count({ where: { categoryId: id } });
  if (productsCount > 0) {
    throw httpError(409, 'No se puede eliminar una categoría que tiene productos asociados');
  }

  await category.destroy();
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
