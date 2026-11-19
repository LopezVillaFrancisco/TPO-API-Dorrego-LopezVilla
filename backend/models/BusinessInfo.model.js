const { DataTypes } = require('sequelize');
const sequelize = require('../databases/database');

const BusinessInfo = sequelize.define(
  'BusinessInfo',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    socialLinks: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    hours: { type: DataTypes.STRING, allowNull: true },
    logoUrl: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'business_info',
    timestamps: false,
  }
);

module.exports = BusinessInfo;
