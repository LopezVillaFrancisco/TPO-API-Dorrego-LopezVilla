// Mismo esquema que backend/auth/permissions.js. El panel oculta lo que el rol no puede hacer,
// pero la API es la que realmente lo bloquea.

export const ROLES = [
  { value: 'dueno', label: 'Dueño', description: 'Todo, incluido el equipo y los datos del comercio.' },
  { value: 'encargado', label: 'Encargado', description: 'Carta completa, mensajes y respuestas rápidas. Ve el equipo y el comercio sin editarlos.' },
  { value: 'atencion', label: 'Atención', description: 'Responde mensajes y marca platos agotados o disponibles.' },
];

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

export const can = (user, permission) => Boolean(user && PERMISSIONS[permission]?.includes(user.role));

export const roleLabel = (role) => ROLES.find((item) => item.value === role)?.label || role;
