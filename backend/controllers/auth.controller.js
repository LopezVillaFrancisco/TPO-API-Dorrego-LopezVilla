const config = require('../config');
const AuthService = require('../services/auth.service');
const { asyncHandler } = require('../utils/http');

const getRegistrationStatus = asyncHandler(async () => {
  const open = await AuthService.isRegistrationOpen();
  return { data: { open }, message: open ? 'Registro abierto' : 'Registro cerrado' };
});

const register = asyncHandler(async (req) => ({
  status: 201,
  data: await AuthService.register(req.body),
  message: 'Usuario registrado correctamente',
}));

const login = asyncHandler(async (req) => ({ data: await AuthService.login(req.body), message: 'Login exitoso' }));

const logout = asyncHandler(async () => ({ message: 'Logout exitoso' }));

const recoverPassword = asyncHandler(async (req) => {
  const resetToken = await AuthService.recoverPassword(req.body);
  return {
    // Como no se envían mails, en desarrollo el token vuelve en la respuesta para poder probar el flujo
    data: config.NODE_ENV !== 'production' && resetToken ? { resetToken } : undefined,
    message: 'Si el email está registrado, se enviarán las instrucciones para recuperar la contraseña',
  };
});

const resetPassword = asyncHandler(async (req) => {
  await AuthService.resetPassword(req.body);
  return { message: 'Contraseña actualizada correctamente' };
});

const getProfile = asyncHandler(async (req) => ({ data: await AuthService.getProfile(req.decoded.id) }));

const updateProfile = asyncHandler(async (req) => ({
  data: await AuthService.updateProfile(req.decoded.id, req.body),
  message: 'Perfil actualizado correctamente',
}));

module.exports = { getRegistrationStatus, register, login, logout, recoverPassword, resetPassword, getProfile, updateProfile };
