const ContactMessageService = require('../services/contactMessage.service');
const { asyncHandler } = require('../utils/http');

const createMessage = asyncHandler(async (req) => ({
  status: 201,
  data: await ContactMessageService.createMessage(req.body),
  message: 'Mensaje enviado correctamente',
}));

const getMessages = asyncHandler(async (req) => ({
  data: await ContactMessageService.getMessages({
    status: req.query.status,
    search: req.query.search,
    archived: req.query.archived,
  }),
}));

const getSummary = asyncHandler(async () => ({ data: await ContactMessageService.getSummary() }));

const updateMessage = asyncHandler(async (req) => ({
  data: await ContactMessageService.updateMessage(req.params.id, req.body, req.decoded.id),
  message: 'Mensaje actualizado',
}));

const deleteMessage = asyncHandler(async (req) => {
  await ContactMessageService.deleteMessage(req.params.id);
  return { message: 'Mensaje eliminado correctamente' };
});

module.exports = { createMessage, getMessages, getSummary, updateMessage, deleteMessage };
