const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const crypto = require('crypto');
const config = require('../config');
const AdminUser = require('../models/AdminUser.model');

const { httpError, saveUnique: saveUniqueField } = require('../utils/http');

const saveUnique = (operation) =>
  saveUniqueField(operation, (field) => (field === 'username' ? 'El usuario ya está en uso' : 'El email ya está registrado'));

const MIN_PASSWORD = 6;
const BCRYPT_ROUNDS = 10;

const validatePassword = (password) => {
  if (String(password).length < MIN_PASSWORD) {
    throw httpError(400, `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
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

const isRegistrationOpen = async () => (await AdminUser.count()) === 0;

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

const validateRole = (role) => {
  if (!AdminUser.ROLES.includes(role)) {
    throw httpError(400, `role debe ser uno de: ${AdminUser.ROLES.join(', ')}`);
  }
};

const countOwners = () => AdminUser.count({ where: { role: 'dueno' } });

const createAdmin = async ({ firstName, lastName, email, username, phone, password, role = 'encargado' }) => {
  validateRole(role);
  if (!firstName || !lastName || !email || !password) {
    throw httpError(400, 'firstName, lastName, email y password son obligatorios');
  }
  validatePassword(password);
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
      role,
      password: bcrypt.hashSync(password, BCRYPT_ROUNDS),
    })
  );

  return user;
};

const register = async (data) => {
  if (!(await isRegistrationOpen())) {
    throw httpError(403, 'El registro está cerrado: el comercio ya tiene administradores');
  }
  // El primer usuario es el Dueño del panel
  const user = await createAdmin({ ...data, role: 'dueno' });
  return { token: generateToken(user), user: toPublicUser(user) };
};

const listAdmins = async () => {
  const users = await AdminUser.findAll({ order: [['date', 'ASC'], ['id', 'ASC']] });
  return users.map(toPublicUser);
};

const addAdmin = async (data) => toPublicUser(await createAdmin(data));

const deleteAdmin = async (id, requesterId) => {
  if (Number(id) === Number(requesterId)) {
    throw httpError(400, 'No podés eliminar tu propio usuario');
  }
  const user = await AdminUser.findByPk(id);
  if (!user) {
    throw httpError(404, 'Usuario no encontrado');
  }
  if (user.role === 'dueno' && (await countOwners()) <= 1) {
    throw httpError(400, 'No se puede eliminar al único Dueño del panel');
  }
  await user.destroy();
};

// Edición desde Equipo: además de los datos personales permite cambiar el rol
const updateStaffMember = async (id, data, requesterId) => {
  const { role, ...profile } = data;
  if (role !== undefined) {
    validateRole(role);
    const user = await AdminUser.findByPk(id);
    if (!user) {
      throw httpError(404, 'Usuario no encontrado');
    }
    if (role !== user.role) {
      if (Number(id) === Number(requesterId)) {
        throw httpError(400, 'No podés cambiar tu propio rol');
      }
      if (user.role === 'dueno' && (await countOwners()) <= 1) {
        throw httpError(400, 'Tiene que quedar al menos un Dueño en el panel');
      }
      user.role = role;
      await user.save();
    }
  }
  return updateProfile(id, profile);
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
  validatePassword(password);
  validatePassword(password);

  const user = await AdminUser.findOne({ where: { resetPasswordToken: token } });
  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw httpError(400, 'Token de recuperación inválido o expirado');
  }

  user.password = bcrypt.hashSync(password, BCRYPT_ROUNDS);
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
  if (password) {
    validatePassword(password);
    user.password = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  }

  await saveUnique(() => user.save());
  return toPublicUser(user);
};

module.exports = { isRegistrationOpen, register, listAdmins, addAdmin, deleteAdmin, updateStaffMember, login, recoverPassword, resetPassword, getProfile, updateProfile };
