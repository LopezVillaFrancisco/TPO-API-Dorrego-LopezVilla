const express = require('express');
const BusinessInfoController = require('../../controllers/businessInfo.controller');
const authorization = require('../../auth/authorization');
const { requirePermission } = require('../../auth/permissions');

const router = express.Router();

router.get('/', BusinessInfoController.getBusinessInfo);
router.patch('/', authorization, requirePermission('business.edit'), BusinessInfoController.updateBusinessInfo);

module.exports = router;
