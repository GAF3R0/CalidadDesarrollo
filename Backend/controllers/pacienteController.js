const Paciente = require('../models/pacienteModel');

/**
 * Registra un nuevo paciente y su expediente clínico en una operación atómica.
 */
exports.crearPaciente = async (req, res) => {
  try {
    const { 
      nombre, 
      apellido, 
      sexo, 
      fecha_nacimiento, 
      tipo_sangre,
      numero_expediente,
      procedencia 
    } = req.body;

    if (!nombre || !apellido || !tipo_sangre || !numero_expediente) {
      return res.status(400).json({ 
        msg: 'Nombre, apellido, tipo de sangre y número de expediente son obligatorios' 
      });
    }

    const resultado = await Paciente.insertPacienteConExpediente(
      nombre.trim(), 
      apellido.trim(), 
      sexo, 
      fecha_nacimiento, 
      tipo_sangre, 
      numero_expediente.trim(), 
      procedencia
    );

    res.status(201).json({ 
      msg: 'Paciente y expediente registrados con éxito',
      paciente_id: resultado.paciente_id,
      data: resultado.paciente
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ 
        msg: 'El número de expediente ya se encuentra registrado en el sistema.' 
      });
    }
    console.error('Error al registrar paciente:', error);
    res.status(500).json({ msg: 'Error interno en el servidor al registrar el paciente' });
  }
};

/**
 * Obtiene la lista de todos los pacientes activos.
 */
exports.mostrarPaciente = async (req, res) => {
  try {
    const pacientes = await Paciente.findPacientes();
    res.status(200).json(pacientes);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ msg: 'Error al cargar los pacientes' });
  }
};

/**
 * Actualiza los datos de un paciente y su expediente.
 */
exports.actualizarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    if (!datos.nombre || !datos.tipo_sangre || !datos.numero_expediente) {
      return res.status(400).json({ 
        msg: 'Nombre, tipo de sangre y número de expediente son obligatorios.' 
      });
    }

    const resultado = await Paciente.updatePaciente(id, datos);

    if (resultado.notFound) {
      return res.status(404).json({ msg: 'Paciente no encontrado o inactivo.' });
    }

    res.status(200).json({ 
      msg: 'Paciente actualizado con éxito',
      paciente: resultado.paciente
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ 
        msg: 'El número de expediente ya pertenece a otro paciente.' 
      });
    }
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ msg: 'Error al actualizar el paciente' });
  }
};

/**
 * Realiza un borrado lógico del paciente para proteger el historial médico legal.
 */
exports.eliminarPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await Paciente.deletePaciente(id);
    
    if (resultado.deleted) {
      res.status(200).json({ msg: 'Paciente dado de baja con éxito' });
    } else {
      res.status(404).json({ msg: 'Paciente no encontrado o ya inactivo' });
    }

  } catch (error) {
    console.error('Error al dar de baja al paciente:', error);
    res.status(500).json({ msg: 'Error al eliminar el paciente' });
  }
};