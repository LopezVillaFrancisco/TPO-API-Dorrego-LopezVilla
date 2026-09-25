const express = require('express');
const ProductController = require('../../controllers/product.controller');
const authorization = require('../../auth/authorization');

const router = express.Router();

router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', authorization, ProductController.createProduct);
router.patch('/:id', authorization, ProductController.updateProduct);
router.delete('/:id', authorization, ProductController.deleteProduct);

module.exports = router;
