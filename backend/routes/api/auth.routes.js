const express = require('express');
const AuthController = require('../../controllers/auth.controller');
const authorization = require('../../auth/authorization');
const rateLimit = require('../../middlewares/rateLimit');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Demasiados intentos. Probá de nuevo en unos minutos.' });

const router = express.Router();

router.get('/registration', AuthController.getRegistrationStatus);
router.post('/registration', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/recover-password', authLimiter, AuthController.recoverPassword);
router.post('/reset-password', authLimiter, AuthController.resetPassword);
router.get('/profile', authorization, AuthController.getProfile);
router.patch('/profile', authorization, AuthController.updateProfile);

module.exports = router;
