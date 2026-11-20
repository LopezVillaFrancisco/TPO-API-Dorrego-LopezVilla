const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const crypto = require('crypto');
const config = require('../config');
const AdminUser = require('../models/AdminUser.model');

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const saveUnique = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = Object.keys(error.fields || {})[0];
      throw httpError(409, field === 'username' ? 'El usuario ya está en uso' : 'El email ya está registrado');
    }
    throw error;
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USERNAME_REGEX = /^[a-z0-9._]{3,30}$/;

const validateEmail = (email) => {
  if (!EMAIL_REGEX.test(email)) {
    throw httpError(400, 'El email no tiene un formato válido');
  }
};

const normalizeUsername = (username) => {
  if (username === undefined || username === null || String(username).trim() === '') return null;
  const value = String(username).trim().toLowerCase();
  if (!USERNAME_REGEX.test(value)) {
    throw httpError(400, 'El usuario debe tener entre 3 y 30 caracteres: letras, números, punto o guion bajo');
  }
  return value;
};

const ensureUsernameFree = async (username, ownId) => {
  if (!username) return;
  const existing = await AdminUser.findOne({ where: { username } });
  if (existing && existing.id !== ownId) {
    throw httpError(409, 'El usuario ya está en uso');
  }
};

const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

const toPublicUser = (user) => {
  const { password, resetPasswordToken, resetPasswordExpires, ...publicUser } = user.toJSON();
  return publicUser;
};

const register = async ({ firstName, lastName, email, username, phone, password }) => {
  if (!firstName || !lastName || !email || !password) {
    throw httpError(400, 'firstName, lastName, email y password son obligatorios');
  }
  validateEmail(email);
  const cleanUsername = normalizeUsername(username);

  const existing = await AdminUser.findOne({ where: { email } });
  if (existing) {
    throw httpError(409, 'El email ya está registrado');
  }
  await ensureUsernameFree(cleanUsername);

  const user = await saveUnique(() =>
    AdminUser.create({
      firstName,
      lastName,
      email,
      username: cleanUsername,
      phone,
      password: bcrypt.hashSync(password, 8),
    })
  );

  return { token: generateToken(user), user: toPublicUser(user) };
};

const login = async ({ identifier, email, password }) => {
  const value = String(identifier ?? email ?? '').trim();
  if (!value || !password) {
    throw httpError(400, 'Email o usuario y password son obligatorios');
  }

  const user = await AdminUser.findOne({
    where: { [Op.or]: [{ email: value }, { username: value.toLowerCase() }] },
  });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw httpError(401, 'Credenciales inválidas');
  }

  return { token: generateToken(user), user: toPublicUser(user) };
};

const recoverPassword = async ({ email }) => {
  if (!email) {
    throw httpError(400, 'El email es obligatorio');
  }

  const user = await AdminUser.findOne({ where: { email } });
  if (!user) return null;

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + config.RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);
  await user.save();

  return resetToken;
};

const resetPassword = async ({ token, password }) => {
  if (!token || !password) {
    throw httpError(400, 'Token y password son obligatorios');
  }

  const user = await AdminUser.findOne({ where: { resetPasswordToken: token } });
  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw httpError(400, 'Token de recuperación inválido o expirado');
  }

  user.password = bcrypt.hashSync(password, 8);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
};

const getProfile = async (id) => {
  const user = await AdminUser.findByPk(id);
  if (!user) {
    throw httpError(404, 'Usuario no encontrado');
  }
  return toPublicUser(user);
};

const updateProfile = async (id, { firstName, lastName, email, username, phone, password }) => {
  const user = await AdminUser.findByPk(id);
  if (!user) {
    throw httpError(404, 'Usuario no encontrado');
  }

  if (email && email !== user.email) {
    validateEmail(email);
    const existing = await AdminUser.findOne({ where: { email } });
    if (existing) {
      throw httpError(409, 'El email ya está registrado');
    }
    user.email = email;
  }

  if (username !== undefined) {
    const cleanUsername = normalizeUsername(username);
    await ensureUsernameFree(cleanUsername, user.id);
    user.username = cleanUsername;
  }

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (password) user.password = bcrypt.hashSync(password, 8);

  await saveUnique(() => user.save());
  return toPublicUser(user);
};

module.exports = { register, login, recoverPassword, resetPassword, getProfile, updateProfile };
