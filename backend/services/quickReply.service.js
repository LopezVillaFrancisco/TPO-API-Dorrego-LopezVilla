const QuickReply = require('../models/QuickReply.model');
const { httpError } = require('../utils/http');

const MAX_REPLIES = 30;
const LIMITS = { title: 60, text: 1000 };

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

const validate = ({ title, text }) => {
  if (!title || !text) throw httpError(400, 'title y text son obligatorios');
  if (title.length > LIMITS.title) throw httpError(400, `title admite hasta ${LIMITS.title} caracteres`);
  if (text.length > LIMITS.text) throw httpError(400, `text admite hasta ${LIMITS.text} caracteres`);
};

const getQuickReplies = () => QuickReply.findAll({ order: [['order', 'ASC'], ['id', 'ASC']] });

const createQuickReply = async ({ title, text }) => {
  const data = { title: clean(title), text: clean(text) };
  validate(data);
  const count = await QuickReply.count();
  if (count >= MAX_REPLIES) throw httpError(400, `Se pueden guardar hasta ${MAX_REPLIES} respuestas rápidas`);
  return QuickReply.create({ ...data, order: count });
};

const updateQuickReply = async (id, { title, text, order }) => {
  const reply = await QuickReply.findByPk(id);
  if (!reply) throw httpError(404, 'Respuesta rápida no encontrada');

  const data = {
    title: title === undefined ? reply.title : clean(title),
    text: text === undefined ? reply.text : clean(text),
  };
  validate(data);
  reply.title = data.title;
  reply.text = data.text;
  if (order !== undefined) {
    if (!Number.isInteger(Number(order))) throw httpError(400, 'order debe ser un número entero');
    reply.order = Number(order);
  }

  await reply.save();
  return reply;
};

const deleteQuickReply = async (id) => {
  const reply = await QuickReply.findByPk(id);
  if (!reply) throw httpError(404, 'Respuesta rápida no encontrada');
  await reply.destroy();
};

module.exports = { getQuickReplies, createQuickReply, updateQuickReply, deleteQuickReply };
