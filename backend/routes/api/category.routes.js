const express = require('express');
const CategoryController = require('../../controllers/category.controller');
const authorization = require('../../auth/authorization');
const { requirePermission } = require('../../auth/permissions');

const router = express.Router();

router.get('/', CategoryController.getCategories);
router.post('/', authorization, requirePermission('menu.edit'), CategoryController.createCategory);
router.patch('/:id', authorization, requirePermission('menu.edit'), CategoryController.updateCategory);
router.delete('/:id', authorization, requirePermission('menu.edit'), CategoryController.deleteCategory);

module.exports = router;
