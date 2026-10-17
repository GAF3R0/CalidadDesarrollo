const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { protegerRuta, verificarRol } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');


router.get('/', protegerRuta, usuarioController.obtenerTodosLosMedicos);


router.post('/', protegerRuta, verificarRol(['Administrador']), usuarioController.crearMedico);

router.put('/:id', protegerRuta, verificarRol(['Administrador']), usuarioController.actualizarMedico);

router.delete('/:id', protegerRuta, verificarRol(['Administrador']), usuarioController.eliminarMedico);

router.put(
    '/perfil/foto', 
    protegerRuta, 
    upload.single('fotoPerfil'),
    usuarioController.subirFotoPerfil
);

router.get('/especialistas', protegerRuta, usuarioController.obtenerEspecialistas);

module.exports = router;