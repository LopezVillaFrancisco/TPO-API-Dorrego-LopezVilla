const { DataTypes } = require('sequelize');
const sequelize = require('../databases/database');

const ROLES = ['dueno', 'encargado', 'atencion'];

const AdminUser = sequelize.define(
  'AdminUser',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
    username: { type: DataTypes.STRING(30), allowNull: true, unique: true },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'encargado', validate: { isIn: [ROLES] } },
    password: { type: DataTypes.STRING, allowNull: false },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'admin_users',
    timestamps: false,
  }
);

AdminUser.ROLES = ROLES;

module.exports = AdminUser;
