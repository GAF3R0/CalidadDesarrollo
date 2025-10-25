const express = require('express');
const router = express.Router();
const equipoMedicoController = require('../controllers/equipoMedicoController');
const { protegerRuta, verificarRol } = require('../middleware/authMiddleware');

// GET routes
router.get('/', protegerRuta, equipoMedicoController.obtenerTodosLosEquipos); // ✅ Ahora devuelve equipos completos
router.get('/nombres', protegerRuta, equipoMedicoController.obtenerNombresEquipos); // ✅ Nueva ruta para solo nombres
router.get('/entradas', protegerRuta, equipoMedicoController.obtenerTodasLasEntradas);
router.get('/completos', protegerRuta, equipoMedicoController.obtenerEquiposCompletos);
router.get('/estadisticas', protegerRuta, equipoMedicoController.obtenerEstadisticasEquipos);
router.get('/vacios', protegerRuta, equipoMedicoController.obtenerEquiposVacios);
router.get('/:nombre', protegerRuta, equipoMedicoController.obtenerEquipoPorNombre);

// POST routes
router.post('/', protegerRuta, equipoMedicoController.crearEquipo);

// PUT routes
router.put('/:id', protegerRuta, equipoMedicoController.actualizarMiembroEquipo);

// DELETE routes
router.delete('/:nombre', protegerRuta, equipoMedicoController.eliminarEquipo);
router.delete('/miembros/:id', protegerRuta, equipoMedicoController.eliminarMiembroEquipo);

module.exports = router;