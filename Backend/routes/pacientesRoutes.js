const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const { protegerRuta, verificarRol } = require('../middleware/authMiddleware');

// Rutas protegidas para personal médico autorizado
router.get('/', protegerRuta, pacienteController.mostrarPaciente);
router.post('/', protegerRuta, pacienteController.crearPaciente);
router.put('/:id', protegerRuta, pacienteController.actualizarPaciente);

// Eliminación restringida únicamente a Administradores
router.delete('/:id', protegerRuta, verificarRol(['Administrador']), pacienteController.eliminarPaciente);

module.exports = router;