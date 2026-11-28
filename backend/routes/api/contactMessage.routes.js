const express = require('express');
const ContactMessageController = require('../../controllers/contactMessage.controller');
const authorization = require('../../auth/authorization');
const rateLimit = require('../../middlewares/rateLimit');

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Enviaste varias consultas seguidas. Esperá unos minutos y volvé a intentar.',
});

const router = express.Router();

router.post('/', contactLimiter, ContactMessageController.createMessage);
router.get('/', authorization, ContactMessageController.getMessages);
router.get('/summary', authorization, ContactMessageController.getSummary);
router.patch('/:id', authorization, ContactMessageController.updateMessage);
router.delete('/:id', authorization, ContactMessageController.deleteMessage);

module.exports = router;
