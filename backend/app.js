const config = require('./config');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { DataTypes } = require('sequelize');
const sequelize = require('./databases/database');
require('./models/AdminUser.model');
require('./models/BusinessInfo.model');
require('./models/Category.model');
require('./models/Product.model');
require('./models/ProductImage.model');
require('./models/ContactMessage.model');

const apiRouter = require('./routes/api');

const app = express();

app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ status: 404, message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ status: err.statusCode || 500, message: err.message || 'Error interno' });
});

// sync() crea las tablas que faltan pero no agrega columnas nuevas a tablas que ya existen
const addMissingColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('products');
  if (!columns.tags) {
    await queryInterface.addColumn('products', 'tags', {
      type: DataTypes.ARRAY(DataTypes.STRING(30)),
      allowNull: false,
      defaultValue: [],
    });
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
