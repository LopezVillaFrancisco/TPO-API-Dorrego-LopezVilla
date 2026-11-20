const express = require('express');

const authRoutes = require('./api/auth.routes');
const categoryRoutes = require('./api/category.routes');
const productRoutes = require('./api/product.routes');
const businessInfoRoutes = require('./api/businessInfo.routes');
const contactMessageRoutes = require('./api/contactMessage.routes');
const adminUserRoutes = require('./api/adminUser.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/business-info', businessInfoRoutes);
router.use('/contact-messages', contactMessageRoutes);
router.use('/admin-users', adminUserRoutes);

module.exports = router;
