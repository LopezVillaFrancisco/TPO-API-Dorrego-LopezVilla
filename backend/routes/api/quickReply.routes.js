const express = require('express');
const QuickReplyController = require('../../controllers/quickReply.controller');
const authorization = require('../../auth/authorization');

const router = express.Router();

router.use(authorization);
router.get('/', QuickReplyController.getQuickReplies);
router.post('/', QuickReplyController.createQuickReply);
router.patch('/:id', QuickReplyController.updateQuickReply);
router.delete('/:id', QuickReplyController.deleteQuickReply);

module.exports = router;
