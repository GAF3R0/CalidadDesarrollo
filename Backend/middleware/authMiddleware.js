// middleware/authMiddleware.js
const { verifyToken } = require('../utils/cryptoService');

// Middleware para verificar si el usuario tiene un token válido
const protegerRuta = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: 'Acceso denegado, no se proporcionó token.' });
  }

  try {
    const decifrado = verifyToken(token);
    req.usuario = decifrado.usuario; // Adjuntamos el payload del token a la petición
    next(); // El token es válido, puede continuar
  } catch (error) {
    res.status(401).json({ msg: 'Token no válido o expirado.' });
  }
};

// Middleware para verificar el rol (se usa DESPUÉS de protegerRuta)
const verificarRol = (rolesPermitidos) => (req, res, next) => {
  if (!req.usuario || !rolesPermitidos.includes(req.usuario.role)) {
    return res.status(403).json({ msg: 'Acceso denegado: no tienes los permisos necesarios.' });
  }
  next(); // El rol es correcto, puede continuar
};

module.exports = {
  protegerRuta,
  verificarRol
};