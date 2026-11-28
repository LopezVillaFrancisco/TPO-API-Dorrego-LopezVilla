// Errores con código HTTP y wrapper para controllers async.
// Los controllers devuelven { status?, data?, message? } y el error handler de app.js formatea los errores.

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    const result = (await handler(req, res)) || {};
    if (res.headersSent) return;
    const status = result.status || 200;
    const body = { status };
    if (result.data !== undefined) body.data = result.data;
    if (result.message) body.message = result.message;
    res.status(status).json(body);
  } catch (error) {
    next(error);
  }
};

// Traduce violaciones de unicidad de Sequelize a un 409 con un mensaje propio
const saveUnique = async (operation, messageFor) => {
  try {
    return await operation();
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = Object.keys(error.fields || {})[0];
      throw httpError(409, messageFor(field));
    }
    throw error;
  }
};

// Escapa los comodines de LIKE para que la búsqueda sea literal
const escapeLike = (value) => String(value).replace(/[\%_]/g, (char) => `\${char}`);

module.exports = { httpError, asyncHandler, saveUnique, escapeLike };
