const { Op } = require('sequelize');
const sequelize = require('../databases/database');
const Product = require('../models/Product.model');
const ProductImage = require('../models/ProductImage.model');
const Category = require('../models/Category.model');

const { httpError, escapeLike } = require('../utils/http');

const UPDATABLE_FIELDS = [
  'categoryId',
  'name',
  'description',
  'price',
  'discountPrice',
  'badgeType',
  'badgeExpiresAt',
  'tags',
  'isAvailable',
  'order',
];

const includeRelations = [
  { model: Category, as: 'category', attributes: ['id', 'name'] },
  { model: ProductImage, as: 'images', attributes: ['id', 'url', 'order'] },
];

const productOrder = [
  ['order', 'ASC'],
  ['id', 'ASC'],
  [{ model: ProductImage, as: 'images' }, 'order', 'ASC'],
];

const buildImages = (productId, images) =>
  images.map((image, index) => {
    const url = typeof image === 'string' ? image : image.url;
    const order = typeof image === 'object' && image.order !== undefined ? image.order : index;
    return { productId, url, order };
  });

const validateImages = (images) => {
  if (!Array.isArray(images)) {
    throw httpError(400, 'images debe ser un array de URLs');
  }
  if (images.some((image) => !(typeof image === 'string' ? image : image && image.url))) {
    throw httpError(400, 'Cada imagen debe tener una URL');
  }
};

const validateFields = (fields) => {
  ['price', 'discountPrice'].forEach((field) => {
    const value = fields[field];
    if (value !== undefined && value !== null && (Number.isNaN(Number(value)) || Number(value) < 0)) {
      throw httpError(400, `${field} debe ser un número mayor o igual a 0`);
    }
  });
  if (fields.badgeType !== undefined && !Product.BADGE_TYPES.includes(fields.badgeType)) {
    throw httpError(400, `badgeType debe ser uno de: ${Product.BADGE_TYPES.join(', ')}`);
  }
  if (fields.tags !== undefined) {
    if (!Array.isArray(fields.tags) || fields.tags.some((tag) => !Product.TAGS.includes(tag))) {
      throw httpError(400, `tags debe ser un array con valores de: ${Product.TAGS.join(', ')}`);
    }
    fields.tags = [...new Set(fields.tags)];
  }
};

const validateDiscount = ({ badgeType, price, discountPrice }) => {
  if (badgeType !== 'descuento') return;
  if (discountPrice === undefined || discountPrice === null || discountPrice === '') {
    throw httpError(400, 'Un producto con badge descuento necesita discountPrice');
  }
  if (Number(discountPrice) >= Number(price)) {
    throw httpError(400, 'discountPrice debe ser menor que price');
  }
};

const ensureCategoryExists = async (categoryId) => {
  const category = await Category.findByPk(categoryId);
  if (!category) {
    throw httpError(400, 'La categoría indicada no existe');
  }
};

const getProducts = async ({ search, categoryId }) => {
  const where = {};

  const term = typeof search === 'string' ? search.trim() : '';
  if (term) {
    const pattern = `%${escapeLike(term)}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: pattern } },
      { description: { [Op.iLike]: pattern } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  return Product.findAll({ where, include: includeRelations, order: productOrder });
};

const getProductById = async (id) => {
  const product = await Product.findByPk(id, { include: includeRelations, order: productOrder });
  if (!product) {
    throw httpError(404, 'Producto no encontrado');
  }
  return product;
};

const createProduct = async (data) => {
  const { images = [], ...fields } = data;

  if (!fields.name || fields.price === undefined || !fields.categoryId) {
    throw httpError(400, 'name, price y categoryId son obligatorios');
  }
  validateFields(fields);
  validateImages(images);
  await ensureCategoryExists(fields.categoryId);

  const productData = {};
  UPDATABLE_FIELDS.forEach((field) => {
    if (fields[field] !== undefined) productData[field] = fields[field];
  });
  validateDiscount(productData);

  const productId = await sequelize.transaction(async (transaction) => {
    const product = await Product.create(productData, { transaction });
    if (images.length > 0) {
      await ProductImage.bulkCreate(buildImages(product.id, images), { transaction });
    }
    return product.id;
  });

  return getProductById(productId);
};

const updateProduct = async (id, data) => {
  const { images, ...fields } = data;

  const product = await Product.findByPk(id);
  if (!product) {
    throw httpError(404, 'Producto no encontrado');
  }

  validateFields(fields);
  if (images !== undefined) validateImages(images);
  if (fields.categoryId !== undefined) await ensureCategoryExists(fields.categoryId);

  UPDATABLE_FIELDS.forEach((field) => {
    if (fields[field] !== undefined) product[field] = fields[field];
  });
  validateDiscount(product);

  await sequelize.transaction(async (transaction) => {
    await product.save({ transaction });

    if (images !== undefined) {
      await ProductImage.destroy({ where: { productId: id }, transaction });
      if (images.length > 0) {
        await ProductImage.bulkCreate(buildImages(product.id, images), { transaction });
      }
    }
  });

  return getProductById(id);
};

const deleteProduct = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw httpError(404, 'Producto no encontrado');
  }

  await sequelize.transaction(async (transaction) => {
    await ProductImage.destroy({ where: { productId: id }, transaction });
    await product.destroy({ transaction });
  });
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
