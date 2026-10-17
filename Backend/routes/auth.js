const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protegerRuta } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/login', authLimiter, authController.login);

// Permite a cualquier usuario autenticado consultar su propio perfil
router.get('/me', protegerRuta, authController.obtenerPerfil);
module.exports = router;