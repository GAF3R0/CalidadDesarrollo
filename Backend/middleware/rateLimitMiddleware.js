const rateLimit = require('express-rate-limit');

// Limitador general para toda la API (300 peticiones por cada 15 minutos)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    msg: 'Demasiadas peticiones desde esta IP, por favor intente nuevamente en 15 minutos.'
  }
});

// Limitador estricto para el login (10 intentos por cada 15 minutos) para prevenir fuerza bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    msg: 'Demasiados intentos de inicio de sesión. Por seguridad, intente de nuevo en 15 minutos.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
