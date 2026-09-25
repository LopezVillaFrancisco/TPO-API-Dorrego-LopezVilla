const ContactMessage = require('../models/ContactMessage.model');

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const validateStatus = (status) => {
  if (!ContactMessage.STATUSES.includes(status)) {
    throw httpError(400, `status debe ser uno de: ${ContactMessage.STATUSES.join(', ')}`);
  }
};

const createMessage = async ({ name, email, phone, subject, message }) => {
  if (!name || !email || !subject || !message) {
    throw httpError(400, 'name, email, subject y message son obligatorios');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, 'El email no tiene un formato válido');
  }

  return ContactMessage.create({ name, email, phone, subject, message });
};

const getMessages = async ({ status }) => {
  const where = {};
  if (status) {
    validateStatus(status);
    where.status = status;
  }

  return ContactMessage.findAll({ where, order: [['createdAt', 'DESC']] });
};

const updateMessageStatus = async (id, { status }) => {
  validateStatus(status);

  const contactMessage = await ContactMessage.findByPk(id);
  if (!contactMessage) {
    throw httpError(404, 'Mensaje no encontrado');
  }

  contactMessage.status = status;
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

module.exports = { createMessage, getMessages, updateMessageStatus, deleteMessage };
