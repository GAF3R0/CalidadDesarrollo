const Usuario = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/cryptoService');

exports.login = async (req, res) => {
  const { cedula, password } = req.body;

  try {
    const user = await Usuario.findByCedula(cedula);
    if (!user || !user.password) {
      return res.status(401).json({ msg: 'Cédula o contraseña incorrectas' });
    }

    const passCorrecto = await bcrypt.compare(password, user.password);
    if (!passCorrecto) {
      return res.status(401).json({ msg: 'Cédula o contraseña incorrectas' });
    }
    
    const payload = {
      usuario: {
        id: user.id_medicos,
        role: user.role
      }
    };
    const token = signToken(payload);
    
    res.status(200).json({ token });
  } catch (error) {
    console.error('💥 ERROR INESPERADO EN EL LOGIN:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};


exports.obtenerPerfil = async (req, res) => {
  
  
  try {

    const user = await Usuario.findById(req.usuario.id);
   
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    res.json(user);
 

  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};