const express = require('express');
const CategoryController = require('../../controllers/category.controller');
const authorization = require('../../auth/authorization');

const router = express.Router();

router.get('/', CategoryController.getCategories);
router.post('/', authorization, CategoryController.createCategory);
router.patch('/:id', authorization, CategoryController.updateCategory);
router.delete('/:id', authorization, CategoryController.deleteCategory);

module.exports = router;
