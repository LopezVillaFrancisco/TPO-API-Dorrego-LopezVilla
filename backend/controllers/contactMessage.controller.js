const ContactMessageService = require('../services/contactMessage.service');

const createMessage = async (req, res) => {
  try {
    const contactMessage = await ContactMessageService.createMessage(req.body);
    return res.status(201).json({ status: 201, data: contactMessage, message: 'Mensaje enviado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await ContactMessageService.getMessages({ status: req.query.status });
    return res.status(200).json({ status: 200, data: messages });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const updateMessageStatus = async (req, res) => {
  try {
    const contactMessage = await ContactMessageService.updateMessageStatus(req.params.id, req.body);
    return res.status(200).json({ status: 200, data: contactMessage, message: 'Estado del mensaje actualizado' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    await ContactMessageService.deleteMessage(req.params.id);
    return res.status(200).json({ status: 200, message: 'Mensaje eliminado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

module.exports = { createMessage, getMessages, updateMessageStatus, deleteMessage };
