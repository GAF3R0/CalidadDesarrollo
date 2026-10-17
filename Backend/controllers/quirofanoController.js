const Quirofano = require('../models/quirofanoModel');

exports.mostrarquirofano = async (req, res) => {
  try {
    const quirofanos = await Quirofano.allquirofanos();
    res.status(200).json(quirofanos);
  } catch (error) {
    console.error('Error al obtener quirófanos:', error);
    res.status(500).json({ msg: 'Error al cargar los quirófanos' });
  }
};

exports.nuevoquirofano = async (req, res) => {
  const { sala, estado } = req.body;

  try {
    if (!sala || !estado) {
      return res.status(400).json({ 
        msg: 'El nombre de la sala y su estado son obligatorios.' 
      });
    }

    const resultado = await Quirofano.newquirofano(sala, estado);

    res.status(201).json({ 
      msg: 'Quirófano registrado con éxito',
      sala: resultado.sala,
      quirofano: resultado
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ msg: `La sala "${sala}" ya existe.` });
    }
    console.error('Error al crear quirófano:', error);
    res.status(500).json({ msg: 'Error en el servidor al registrar el quirófano' });
  }
};

exports.eliminarquirofano = async (req, res) => {
  try {
    const sala = req.params.sala;
    const resultado = await Quirofano.deletequirofano(sala);

    if (resultado === 0) {
      return res.status(404).json({ msg: 'Quirófano no encontrado.' });
    }

    res.status(200).json({ msg: `Quirófano "${sala}" eliminado con éxito` });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        msg: 'No se puede eliminar el quirófano porque tiene cirugías programadas asociadas.'
      });
    }
    console.error('Error al eliminar quirófano:', error);
    res.status(500).json({ msg: 'Error en el servidor al eliminar el quirófano' });
  }
};

exports.actualizarquirofano = async (req, res) => {
  try {
    const { sala } = req.params;
    const { estado } = req.body;

    if (!sala || !estado) {
      return res.status(400).json({ 
        msg: 'La sala y el estado son obligatorios' 
      });
    }

    const estadosValidos = ['disponible', 'ocupado', 'mantenimiento'];
    if (!estadosValidos.includes(estado.toLowerCase())) {
      return res.status(400).json({ 
        msg: 'Estado inválido. Debe ser: disponible, ocupado o mantenimiento' 
      });
    }

    const resultado = await Quirofano.updatequirofano(sala, estado.toLowerCase());

    if (!resultado) {
      return res.status(404).json({ msg: 'Quirófano no encontrado' });
    }

    res.status(200).json({ 
      msg: 'Quirófano actualizado con éxito',
      data: resultado
    });

  } catch (error) {
    console.error('Error al actualizar quirófano:', error);
    res.status(500).json({ msg: 'Error al actualizar el quirófano' });
  }
};
