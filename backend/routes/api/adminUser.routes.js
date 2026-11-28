const express = require('express');
const AdminUserController = require('../../controllers/adminUser.controller');
const authorization = require('../../auth/authorization');
const { requirePermission } = require('../../auth/permissions');

const router = express.Router();

router.use(authorization);
router.get('/', requirePermission('staff.view'), AdminUserController.getAdminUsers);
router.post('/', requirePermission('staff.edit'), AdminUserController.createAdminUser);
router.patch('/:id', requirePermission('staff.edit'), AdminUserController.updateAdminUser);
router.delete('/:id', requirePermission('staff.edit'), AdminUserController.deleteAdminUser);

module.exports = router;
