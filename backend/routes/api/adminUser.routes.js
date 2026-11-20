const express = require('express');
const AdminUserController = require('../../controllers/adminUser.controller');
const authorization = require('../../auth/authorization');

const router = express.Router();

router.use(authorization);
router.get('/', AdminUserController.getAdminUsers);
router.post('/', AdminUserController.createAdminUser);
router.patch('/:id', AdminUserController.updateAdminUser);
router.delete('/:id', AdminUserController.deleteAdminUser);

module.exports = router;
