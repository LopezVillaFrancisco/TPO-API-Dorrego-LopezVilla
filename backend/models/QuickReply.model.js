const { DataTypes } = require('sequelize');
const sequelize = require('../databases/database');

// Respuestas guardadas que el equipo inserta al contestar una consulta
const QuickReply = sequelize.define(
  'QuickReply',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(60), allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'quick_replies',
    timestamps: false,
  }
);

module.exports = QuickReply;
