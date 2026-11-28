const express = require('express');
const QuickReplyController = require('../../controllers/quickReply.controller');
const authorization = require('../../auth/authorization');
const { requirePermission } = require('../../auth/permissions');

const router = express.Router();

router.use(authorization);
router.get('/', QuickReplyController.getQuickReplies);
router.post('/', requirePermission('quickReplies.edit'), QuickReplyController.createQuickReply);
router.patch('/:id', requirePermission('quickReplies.edit'), QuickReplyController.updateQuickReply);
router.delete('/:id', requirePermission('quickReplies.edit'), QuickReplyController.deleteQuickReply);

module.exports = router;
