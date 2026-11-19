const { DataTypes } = require('sequelize');
const sequelize = require('../databases/database');
const Category = require('./Category.model');
const ProductImage = require('./ProductImage.model');

const BADGE_TYPES = ['ninguno', 'descuento', 'nuevo', 'mas_vendido', 'recomendado_chef', 'ultimas_unidades'];

const isBadgeExpired = (expiresAt) => Boolean(expiresAt) && new Date(expiresAt) < new Date();

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discountPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    badgeType: { type: DataTypes.ENUM(...BADGE_TYPES), allowNull: false, defaultValue: 'ninguno' },
    badgeExpiresAt: { type: DataTypes.DATE, allowNull: true },
    isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    activeBadge: {
      type: DataTypes.VIRTUAL,
      get() {
        return isBadgeExpired(this.getDataValue('badgeExpiresAt')) ? 'ninguno' : this.getDataValue('badgeType');
      },
    },
    finalPrice: {
      type: DataTypes.VIRTUAL,
      get() {
        const discountPrice = this.getDataValue('discountPrice');
        if (this.get('activeBadge') === 'descuento' && discountPrice !== null && discountPrice !== undefined) {
          return discountPrice;
        }
        return this.getDataValue('price');
      },
    },
  },
  {
    tableName: 'products',
    timestamps: false,
  }
);

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.BADGE_TYPES = BADGE_TYPES;

module.exports = Product;
