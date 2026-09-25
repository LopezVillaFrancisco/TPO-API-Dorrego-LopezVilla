const express = require('express');
const AuthController = require('../../controllers/auth.controller');
const authorization = require('../../auth/authorization');

const router = express.Router();

router.post('/registration', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/recover-password', AuthController.recoverPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/profile', authorization, AuthController.getProfile);
router.patch('/profile', authorization, AuthController.updateProfile);

module.exports = router;
