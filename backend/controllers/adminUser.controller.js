const AuthService = require('../services/auth.service');

const getAdminUsers = async (req, res) => {
  try {
    const users = await AuthService.listAdmins();
    return res.status(200).json({ status: 200, data: users });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const user = await AuthService.addAdmin(req.body);
    return res.status(201).json({ status: 201, data: user, message: 'Usuario creado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const updateAdminUser = async (req, res) => {
  try {
    const user = await AuthService.updateProfile(req.params.id, req.body);
    return res.status(200).json({ status: 200, data: user, message: 'Usuario actualizado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    await AuthService.deleteAdmin(req.params.id, req.decoded.id);
    return res.status(200).json({ status: 200, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

module.exports = { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser };
