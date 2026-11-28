const AuthService = require('../services/auth.service');
const { asyncHandler } = require('../utils/http');

const getAdminUsers = asyncHandler(async () => ({ data: await AuthService.listAdmins() }));

const createAdminUser = asyncHandler(async (req) => ({
  status: 201,
  data: await AuthService.addAdmin(req.body),
  message: 'Usuario creado correctamente',
}));

const updateAdminUser = asyncHandler(async (req) => ({
  data: await AuthService.updateProfile(req.params.id, req.body),
  message: 'Usuario actualizado correctamente',
}));

const deleteAdminUser = asyncHandler(async (req) => {
  await AuthService.deleteAdmin(req.params.id, req.decoded.id);
  return { message: 'Usuario eliminado correctamente' };
});

module.exports = { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser };
