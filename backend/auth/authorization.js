const jwt = require('jsonwebtoken');
const config = require('../config');

const authorization = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ status: 401, message: 'Token no provisto' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.decoded = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: 401, message: 'Token inválido o expirado' });
  }
};

module.exports = authorization;
