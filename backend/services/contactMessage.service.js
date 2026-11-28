const { Op } = require('sequelize');
const ContactMessage = require('../models/ContactMessage.model');
const AdminUser = require('../models/AdminUser.model');
const { httpError, escapeLike } = require('../utils/http');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+()-]{6,30}$/;
const DEFAULT_SUBJECT = 'Consulta general';

const LIMITS = { name: 150, email: 150, subject: 200, message: 2000, internalNote: 2000 };

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

const validateStatus = (status) => {
  if (!ContactMessage.STATUSES.includes(status)) {
    throw httpError(400, `status debe ser uno de: ${ContactMessage.STATUSES.join(', ')}`);
  }
};

const checkLength = (field, value) => {
  if (value.length > LIMITS[field]) {
    throw httpError(400, `${field} admite hasta ${LIMITS[field]} caracteres`);
  }
};

const createMessage = async ({ name, email, phone, subject, message, website }) => {
  // Campo trampa: el formulario lo deja oculto y vacío; si llega completo es un bot.
  // Se responde como si se hubiera guardado para no darle pistas.
  if (clean(website)) {
    return { id: null, status: 'pendiente' };
  }

  const data = {
    name: clean(name),
    email: clean(email).toLowerCase(),
    phone: clean(phone) || null,
    subject: clean(subject) || DEFAULT_SUBJECT,
    message: clean(message),
  };

  if (!data.name || !data.email || !data.message) {
    throw httpError(400, 'name, email y message son obligatorios');
  }
  if (!EMAIL_REGEX.test(data.email)) {
    throw httpError(400, 'El email no tiene un formato válido');
  }
  if (data.phone && !PHONE_REGEX.test(data.phone)) {
    throw httpError(400, 'El teléfono no tiene un formato válido');
  }
  if (data.message.length < 10) {
    throw httpError(400, 'El mensaje debe tener al menos 10 caracteres');
  }
  ['name', 'email', 'subject', 'message'].forEach((field) => checkLength(field, data[field]));

  return ContactMessage.create(data);
};

// Por defecto lista la bandeja (no archivadas). archived=true lista solo las archivadas.
const getMessages = async ({ status, search, archived }) => {
  const where = { archivedAt: archived === 'true' || archived === true ? { [Op.ne]: null } : null };

  if (status) {
    validateStatus(status);
    where.status = status;
  }

  const term = clean(search);
  if (term) {
    const pattern = `%${escapeLike(term)}%`;
    where[Op.or] = ['name', 'email', 'subject', 'message'].map((field) => ({ [field]: { [Op.iLike]: pattern } }));
  }

  return ContactMessage.findAll({ where, order: [['createdAt', 'DESC']] });
};

// Conteos livianos para el menú del panel, que los consulta cada minuto
const getSummary = async () => {
  const inbox = { archivedAt: null };
  const [pending, unanswered] = await Promise.all([
    ContactMessage.count({ where: { ...inbox, status: 'pendiente' } }),
    ContactMessage.count({ where: { ...inbox, status: { [Op.ne]: 'respondido' } } }),
  ]);
  return { pending, unanswered };
};

const adminName = async (adminId) => {
  const admin = adminId ? await AdminUser.findByPk(adminId) : null;
  return admin ? `${admin.firstName} ${admin.lastName}`.trim() : null;
};

// Acepta { status }, { internalNote } y/o { archived }.
// Al pasar a "respondido" se registra cuándo y quién; si vuelve a otro estado, se limpia.
const updateMessage = async (id, { status, internalNote, archived }, adminId) => {
  if (status === undefined && internalNote === undefined && archived === undefined) {
    throw httpError(400, 'Indicá status, internalNote o archived');
  }
  if (archived !== undefined && typeof archived !== 'boolean') {
    throw httpError(400, 'archived debe ser true o false');
  }

  const contactMessage = await ContactMessage.findByPk(id);
  if (!contactMessage) {
    throw httpError(404, 'Mensaje no encontrado');
  }

  if (status !== undefined && status !== contactMessage.status) {
    validateStatus(status);
    contactMessage.status = status;
    if (status === 'respondido') {
      contactMessage.repliedAt = new Date();
      contactMessage.repliedBy = await adminName(adminId);
    } else {
      contactMessage.repliedAt = null;
      contactMessage.repliedBy = null;
    }
  }

  if (internalNote !== undefined) {
    const note = internalNote === null ? '' : clean(String(internalNote));
    checkLength('internalNote', note);
    contactMessage.internalNote = note || null;
  }

  if (archived !== undefined) {
    contactMessage.archivedAt = archived ? contactMessage.archivedAt || new Date() : null;
  }

  await contactMessage.save();
  return contactMessage;
};

const deleteMessage = async (id) => {
  const contactMessage = await ContactMessage.findByPk(id);
  if (!contactMessage) {
    throw httpError(404, 'Mensaje no encontrado');
  }

  await contactMessage.destroy();
};

module.exports = { createMessage, getMessages, getSummary, updateMessage, deleteMessage };
