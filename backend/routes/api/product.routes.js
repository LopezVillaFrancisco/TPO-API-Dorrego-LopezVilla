const express = require('express');
const ProductController = require('../../controllers/product.controller');
const authorization = require('../../auth/authorization');
const { requirePermission } = require('../../auth/permissions');

const router = express.Router();

router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', authorization, requirePermission('menu.edit'), ProductController.createProduct);
// Atención solo puede cambiar isAvailable; el service controla el resto de los campos
router.patch('/:id', authorization, requirePermission('menu.availability'), ProductController.updateProduct);
router.delete('/:id', authorization, requirePermission('menu.edit'), ProductController.deleteProduct);

module.exports = router;
