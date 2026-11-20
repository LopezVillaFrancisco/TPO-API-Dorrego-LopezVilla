const config = require('../config');
const AuthService = require('../services/auth.service');

const getRegistrationStatus = async (req, res) => {
  try {
    const open = await AuthService.isRegistrationOpen();
    return res.status(200).json({ status: 200, data: { open }, message: open ? 'Registro abierto' : 'Registro cerrado' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    return res.status(201).json({ status: 201, data: result, message: 'Usuario registrado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const result = await AuthService.login(req.body);
    return res.status(200).json({ status: 200, data: result, message: 'Login exitoso' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({ status: 200, message: 'Logout exitoso' });
};

const recoverPassword = async (req, res) => {
  try {
    const resetToken = await AuthService.recoverPassword(req.body);
    const response = {
      status: 200,
      message: 'Si el email está registrado, se enviarán las instrucciones para recuperar la contraseña',
    };

    if (config.NODE_ENV !== 'production' && resetToken) {
      response.data = { resetToken };
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    await AuthService.resetPassword(req.body);
    return res.status(200).json({ status: 200, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await AuthService.getProfile(req.decoded.id);
    return res.status(200).json({ status: 200, data: user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await AuthService.updateProfile(req.decoded.id, req.body);
    return res.status(200).json({ status: 200, data: user, message: 'Perfil actualizado correctamente' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: error.statusCode || 500, message: error.message });
  }
};

module.exports = { getRegistrationStatus, register, login, logout, recoverPassword, resetPassword, getProfile, updateProfile };
