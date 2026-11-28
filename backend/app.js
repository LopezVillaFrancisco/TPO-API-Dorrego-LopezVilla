const config = require('./config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { DataTypes } = require('sequelize');
const sequelize = require('./databases/database');
require('./models/AdminUser.model');
require('./models/BusinessInfo.model');
require('./models/Category.model');
require('./models/Product.model');
require('./models/ProductImage.model');
require('./models/ContactMessage.model');
require('./models/QuickReply.model');

const apiRouter = require('./routes/api');

const app = express();

// Detrás de un proxy (Render, Railway, etc.) hace falta para que req.ip sea la IP real del cliente
if (config.TRUST_PROXY) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ status: 404, message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Error interno';

  if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = err.errors?.[0]?.message || 'Datos inválidos';
  } else if (err.type === 'entity.parse.failed') {
    message = 'El cuerpo del pedido no es un JSON válido';
  } else if (err.type === 'entity.too.large') {
    message = 'El cuerpo del pedido es demasiado grande';
  }

  if (status >= 500) {
    console.error(err);
    if (config.NODE_ENV === 'production') message = 'Error interno';
  }

  res.status(status).json({ status, message });
});

// sync() crea las tablas que faltan pero no agrega columnas nuevas a tablas que ya existen
const NEW_COLUMNS = {
  products: {
    tags: { type: DataTypes.ARRAY(DataTypes.STRING(30)), allowNull: false, defaultValue: [] },
  },
  contact_messages: {
    replied_at: { type: DataTypes.DATE, allowNull: true },
    replied_by: { type: DataTypes.STRING(150), allowNull: true },
    internal_note: { type: DataTypes.TEXT, allowNull: true },
    archived_at: { type: DataTypes.DATE, allowNull: true },
  },
};

const addMissingColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  for (const [table, columns] of Object.entries(NEW_COLUMNS)) {
    const existing = await queryInterface.describeTable(table);
    for (const [name, definition] of Object.entries(columns)) {
      if (!existing[name]) await queryInterface.addColumn(table, name, definition);
    }
  }
};

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await addMissingColumns();
    console.log('Conexión a la base de datos establecida');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error.message);
  }
};

app.listen(config.PORT, () => {
  console.log(`Servidor escuchando en el puerto ${config.PORT}`);
  connectDatabase();
});

module.exports = app;
