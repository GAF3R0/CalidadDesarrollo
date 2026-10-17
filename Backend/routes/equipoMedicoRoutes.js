const express = require('express');
const router = express.Router();
const equipoMedicoController = require('../controllers/equipoMedicoController');
const { protegerRuta, verificarRol } = require('../middleware/authMiddleware');


router.get(
    '/', 
    protegerRuta, 
    equipoMedicoController.obtenerTodosLosEquipos
);


router.get(
    '/entradas', 
    protegerRuta,

    equipoMedicoController.obtenerTodasLasEntradas
);



router.post(
    '/', 
    protegerRuta, 
  
    equipoMedicoController.crearEquipo
);


router.put(
    '/:id', 
    protegerRuta, 

    equipoMedicoController.actualizarMiembroEquipo
);
router.delete(
    '/:nombre', 
    protegerRuta, 
    verificarRol(['Administrador']),
    equipoMedicoController.eliminarEquipo
);


router.delete(
    '/miembros/:id', 
    protegerRuta, 

    equipoMedicoController.eliminarMiembroEquipo
);


module.exports = router;

