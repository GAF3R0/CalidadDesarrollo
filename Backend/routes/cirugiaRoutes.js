const express = require('express');
const router = express.Router();
const cirugiaController = require('../controllers/cirugiaController');
const { protegerRuta, verificarRol } = require('../middleware/authMiddleware');

router.get(
    '/', 
    protegerRuta, 
    cirugiaController.obtenerTodasLasCirugias
);


router.get(
    '/:id', 
    protegerRuta,  
    cirugiaController.obtenerCirugiaPorId
);

router.post(
    '/', 
    protegerRuta, 
    cirugiaController.crearCirugia
);


router.put(
    '/:id', 
    protegerRuta, 
    cirugiaController.actualizarCirugia
);

router.delete(
    '/:id', 
    protegerRuta, 
    verificarRol(['Administrador']),
    cirugiaController.eliminarCirugia
);

module.exports = router;