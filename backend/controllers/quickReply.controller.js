const QuickReplyService = require('../services/quickReply.service');
const { asyncHandler } = require('../utils/http');

const getQuickReplies = asyncHandler(async () => ({ data: await QuickReplyService.getQuickReplies() }));

const createQuickReply = asyncHandler(async (req) => ({
  status: 201,
  data: await QuickReplyService.createQuickReply(req.body),
  message: 'Respuesta rápida creada',
}));

const updateQuickReply = asyncHandler(async (req) => ({
  data: await QuickReplyService.updateQuickReply(req.params.id, req.body),
  message: 'Respuesta rápida actualizada',
}));

const deleteQuickReply = asyncHandler(async (req) => {
  await QuickReplyService.deleteQuickReply(req.params.id);
  return { message: 'Respuesta rápida eliminada' };
});

module.exports = { getQuickReplies, createQuickReply, updateQuickReply, deleteQuickReply };
