const { DataTypes } = require('sequelize');
const sequelize = require('../databases/database');

const Category = sequelize.define(
  'Category',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'categories',
    timestamps: false,
  }
);

module.exports = Category;
