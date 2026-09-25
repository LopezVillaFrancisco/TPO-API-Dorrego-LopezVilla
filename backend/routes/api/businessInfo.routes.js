const express = require('express');
const BusinessInfoController = require('../../controllers/businessInfo.controller');
const authorization = require('../../auth/authorization');

const router = express.Router();

router.get('/', BusinessInfoController.getBusinessInfo);
router.patch('/', authorization, BusinessInfoController.updateBusinessInfo);

module.exports = router;
