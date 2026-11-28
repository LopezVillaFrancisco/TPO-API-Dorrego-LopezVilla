const AdminUser = require('../models/AdminUser.model');

// Roles escalonados: cada uno puede lo mismo que el siguiente y algo más.
//   dueno     → todo, incluido Equipo y datos del Comercio
//   encargado → carta completa, mensajes completos y respuestas rápidas
//   atencion  → responder mensajes (sin eliminar) y marcar platos agotados o disponibles
const { ROLES } = AdminUser;

const PERMISSIONS = {
  'menu.edit': ['dueno', 'encargado'],
  'menu.availability': ['dueno', 'encargado', 'atencion'],
  'messages.reply': ['dueno', 'encargado', 'atencion'],
  'messages.delete': ['dueno', 'encargado'],
  'quickReplies.edit': ['dueno', 'encargado'],
  'business.view': ['dueno', 'encargado'],
  'business.edit': ['dueno'],
  'staff.view': ['dueno', 'encargado'],
  'staff.edit': ['dueno'],
};

const can = (role, permission) => Boolean(PERMISSIONS[permission]?.includes(role));

// Se usa después de authorization. Lee el usuario de la base en cada pedido para que un cambio
// de rol o una baja tengan efecto en el momento, sin esperar a que venza el token.
const loadUser = async (req, res, next) => {
  try {
    const user = await AdminUser.findByPk(req.decoded.id);
    if (!user) {
      return res.status(401).json({ status: 401, message: 'Tu usuario ya no existe. Volvé a ingresar.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requirePermission = (permission) => [
  loadUser,
  (req, res, next) => {
    if (!can(req.user.role, permission)) {
      return res.status(403).json({ status: 403, message: 'Tu rol no tiene permiso para esta acción' });
    }
    return next();
  },
];

module.exports = { ROLES, PERMISSIONS, can, loadUser, requirePermission };
