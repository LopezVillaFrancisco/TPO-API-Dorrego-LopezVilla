const { DataTypes } = require('sequelize');
const sequelize = require('../databases/database');

const ProductImage = sequelize.define(
  'ProductImage',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    url: { type: DataTypes.STRING(500), allowNull: false },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'product_images',
    timestamps: false,
  }
);

module.exports = ProductImage;
