const express = require('express');
const router = express.Router();
const quirofanoController = require('../controllers/quirofanoController');
const { protegerRuta, verificarRol } = require('../middleware/authMiddleware');

router.get('/', protegerRuta, quirofanoController.mostrarquirofano);
router.post('/', protegerRuta, verificarRol(['Administrador']), quirofanoController.nuevoquirofano);
router.put('/:sala', protegerRuta, quirofanoController.actualizarquirofano);
router.delete('/:sala', protegerRuta, verificarRol(['Administrador']), quirofanoController.eliminarquirofano);

module.exports = router;