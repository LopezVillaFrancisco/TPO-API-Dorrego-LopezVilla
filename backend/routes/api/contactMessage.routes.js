const express = require('express');
const ContactMessageController = require('../../controllers/contactMessage.controller');
const authorization = require('../../auth/authorization');

const router = express.Router();

router.post('/', ContactMessageController.createMessage);
router.get('/', authorization, ContactMessageController.getMessages);
router.patch('/:id', authorization, ContactMessageController.updateMessageStatus);
router.delete('/:id', authorization, ContactMessageController.deleteMessage);

module.exports = router;
