const Cirugia = require('../models/cirugiaModel');

/**
 * Crea una nueva cirugía con validación de integridad referencial y prevención de conflictos de horario.
 */
exports.crearCirugia = async (req, res) => {
  const { 
    id_expediente, 
    fecha, 
    diagnostico_pre, 
    procedimiento, 
    id_quirófano, 
    id_equipomedico, 
    estado,
    hora_inicio,
    hora_fin
  } = req.body;

  if (!id_expediente || !fecha || !procedimiento || !id_quirófano || !id_equipomedico) {
    return res.status(400).json({ 
      msg: 'Faltan campos obligatorios para registrar la cirugía (expediente, fecha, procedimiento, quirófano y equipo médico).' 
    });
  }

  try {
    // Validación de conflicto de solapamiento de horario en quirófano
    if (hora_inicio && hora_fin) {
      const conflicto = await Cirugia.checkConflictoHorario({
        id_quirofano: id_quirófano,
        fecha,
        hora_inicio,
        hora_fin
      });

      if (conflicto) {
        return res.status(409).json({ 
          msg: `Conflicto de horario: El quirófano "${conflicto.sala}" ya tiene una intervención asignada (${conflicto.procedimiento}) de ${conflicto.hora_inicio} a ${conflicto.hora_fin}.` 
        });
      }
    }

    const datosCirugia = { 
      ...req.body, 
      creado_por: req.usuario?.id ? String(req.usuario.id) : 'sistema' 
    }; 
    const nuevaCirugia = await Cirugia.create(datosCirugia);
    
    res.status(201).json({ msg: 'Cirugía registrada con éxito', cirugia: nuevaCirugia });

  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ 
        msg: 'El expediente, quirófano o equipo médico seleccionado no existe en la base de datos.' 
      });
    }
    console.error('Error al crear cirugía:', error);
    res.status(500).json({ msg: 'Error en el servidor al registrar la cirugía.' });
  }
};

/**
 * Obtiene todas las cirugías con detalles relacionales completos y horarios.
 */
exports.obtenerTodasLasCirugias = async (req, res) => {
  try {
    const cirugias = await Cirugia.findAllDetailed();
    res.status(200).json(cirugias);
  } catch (error) {
    console.error('Error al obtener todas las cirugías:', error);
    res.status(500).json({ msg: 'Error en el servidor al obtener cirugías.' });
  }
};

/**
 * Obtiene una cirugía específica por su ID.
 */
exports.obtenerCirugiaPorId = async (req, res) => {
  try {
    const cirugia = await Cirugia.findById(req.params.id);
    if (!cirugia) {
      return res.status(404).json({ msg: 'Cirugía no encontrada.' });
    }
    res.status(200).json(cirugia);
  } catch (error) {
    console.error(`Error al obtener cirugía ${req.params.id}:`, error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

/**
 * Actualiza una cirugía existente y verifica prevención de conflictos si cambian horarios.
 */
exports.actualizarCirugia = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_quirófano, fecha, hora_inicio, hora_fin } = req.body;

    if (id_quirófano && fecha && hora_inicio && hora_fin) {
      const conflicto = await Cirugia.checkConflictoHorario({
        id_quirofano: id_quirófano,
        fecha,
        hora_inicio,
        hora_fin,
        id_cirugia_excluir: id
      });

      if (conflicto) {
        return res.status(409).json({ 
          msg: `Conflicto de horario: El quirófano "${conflicto.sala}" ya tiene una intervención asignada (${conflicto.procedimiento}) de ${conflicto.hora_inicio} a ${conflicto.hora_fin}.` 
        });
      }
    }

    const cirugiaActualizada = await Cirugia.update(id, req.body);
    if (!cirugiaActualizada) {
      return res.status(404).json({ msg: 'Cirugía no encontrada para actualizar.' });
    }
    res.status(200).json({ msg: 'Cirugía actualizada con éxito', cirugia: cirugiaActualizada });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ 
        msg: 'Uno de los campos de referencia (quirófano, equipo o expediente) no es válido.' 
      });
    }
    console.error('Error al actualizar cirugía:', error);
    res.status(500).json({ msg: 'Error en el servidor al actualizar la cirugía.' });
  }
};

/**
 * Elimina una cirugía y sus horarios asociados de forma segura.
 */
exports.eliminarCirugia = async (req, res) => {
  try {
    const resultado = await Cirugia.remove(req.params.id);
    if (resultado === 0) {
      return res.status(404).json({ msg: 'Cirugía no encontrada para eliminar.' });
    }
    res.status(200).json({ msg: 'Cirugía eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar cirugía:', error);
    res.status(500).json({ msg: 'Error en el servidor al eliminar la cirugía.' });
  }
};