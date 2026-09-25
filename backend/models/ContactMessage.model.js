const { DataTypes } = require('sequelize');
const sequelize = require('../databases/database');

const STATUSES = ['pendiente', 'leido', 'respondido'];

const ContactMessage = sequelize.define(
  'ContactMessage',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    subject: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'pendiente' },
  },
  {
    tableName: 'contact_messages',
    timestamps: true,
    updatedAt: false,
  }
);

ContactMessage.STATUSES = STATUSES;

module.exports = ContactMessage;
