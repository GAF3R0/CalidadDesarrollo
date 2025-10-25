const EquipoMedico = require('../models/equipoMedicoModel');

/**
 * Crea una nueva entrada en la tabla equipo_medico.
 */
exports.crearEquipo = async (req, res) => {
  const { nombre, id_medico } = req.body;

  if (!nombre || !id_medico) {
    return res.status(400).json({ msg: 'El nombre del equipo y el ID del médico son obligatorios.' });
  }

  try {
    const nuevoEquipo = await EquipoMedico.create({ nombre, id_medico });
    res.status(201).json({ msg: 'Miembro agregado al equipo médico con éxito', equipo: nuevoEquipo });
  } catch (error) {
    console.error('Error en el controlador al crear equipo:', error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

/**
 * Obtiene los detalles de todos los miembros de un equipo por su nombre.
 */
exports.obtenerEquipoPorNombre = async (req, res) => {
  try {
    // Usamos decodeURIComponent para manejar nombres con espacios o caracteres especiales
    const nombreEquipo = decodeURIComponent(req.params.nombre); 
    const miembros = await EquipoMedico.findByName(nombreEquipo);
    
    if (miembros.length === 0) {
      return res.status(404).json({ msg: 'No se encontró un equipo con ese nombre.' });
    }
    res.json(miembros);
  } catch (error) {
    console.error('Error al obtener equipo por nombre:', error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

/**
 * Obtiene la lista de NOMBRES de equipos únicos.
 * Usa la nueva función del modelo: findAllTeamNames.
 */
exports.obtenerTodosLosEquipos = async (req, res) => {
  try {
    // Obtener todos los equipos completos con miembros
    const equiposCompletos = await EquipoMedico.findCompleteTeams();
    
    console.log('Equipos completos desde BD:', equiposCompletos); // Para debug
    
    // Agrupar por nombre de equipo
    const equiposAgrupados = {};
    
    equiposCompletos.forEach(entry => {
      const nombreEquipo = entry.nombre_equipo;
      
      if (!equiposAgrupados[nombreEquipo]) {
        equiposAgrupados[nombreEquipo] = {
          nombre: nombreEquipo,
          miembros: []
        };
      }
      
      // Solo agregar si tiene un médico asignado
      if (entry.id_medicos) {
        equiposAgrupados[nombreEquipo].miembros.push({
          id_equipomedico: entry.id_equipomedico,
          id_medicos: entry.id_medicos,
          medico_nombre: entry.medico_nombre,
          apellido_paterno: entry.apellido_paterno,
          apellido_materno: entry.apellido_materno,
          especialidad: entry.especialidad
        });
      }
    });
    
    // Convertir a array
    const resultado = Object.values(equiposAgrupados);
    
    console.log('Equipos agrupados para frontend:', resultado); // Para debug
    
    res.json(resultado);
    
  } catch (error) {
    console.error('Error al obtener todos los equipos:', error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};


/**
 * FUNCIÓN NUEVA: Obtiene todas las entradas de la tabla equipo_medico.
 * Perfecta para poblar menús desplegables que necesitan un ID y un nombre.
 */
exports.obtenerTodasLasEntradas = async (req, res) => {
    try {
        const entradas = await EquipoMedico.findAllEntries();
        res.json(entradas);
    } catch (error) {
        console.error('Error al obtener todas las entradas de equipo:', error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * FUNCIÓN NUEVA: Obtiene equipos completos con información detallada
 */
exports.obtenerEquiposCompletos = async (req, res) => {
    try {
        const equipos = await EquipoMedico.findCompleteTeams();
        res.json(equipos);
    } catch (error) {
        console.error('Error al obtener equipos completos:', error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * FUNCIÓN NUEVA: Obtiene estadísticas de equipos
 */
exports.obtenerEstadisticasEquipos = async (req, res) => {
    try {
        const stats = await EquipoMedico.countMembersByTeam();
        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas de equipos:', error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * FUNCIÓN NUEVA: Obtiene equipos vacíos
 */
exports.obtenerEquiposVacios = async (req, res) => {
    try {
        const equiposVacios = await EquipoMedico.findEmptyTeams();
        res.json(equiposVacios);
    } catch (error) {
        console.error('Error al obtener equipos vacíos:', error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * Actualiza el médico asignado a una entrada específica del equipo.
 * Se identifica la entrada por su ID (id_equipomedico).
 */
exports.actualizarMiembroEquipo = async (req, res) => {
  const { id_medico } = req.body;
  
  if (!id_medico) {
    return res.status(400).json({ msg: 'El ID del nuevo médico es obligatorio.' });
  }

  try {
    const equipoActualizado = await EquipoMedico.update(req.params.id, { id_medico });
    if (!equipoActualizado) {
      return res.status(404).json({ msg: 'No se encontró la entrada del equipo médico para actualizar.' });
    }
    res.json({ msg: 'Miembro del equipo actualizado con éxito', equipo: equipoActualizado });
  } catch (error) {
    console.error('Error al actualizar miembro del equipo:', error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

/**
 * Elimina todas las entradas asociadas a un nombre de equipo.
 */
exports.eliminarEquipo = async (req, res) => {
  try {
     const nombreEquipo = decodeURIComponent(req.params.nombre);
    const filasEliminadas = await EquipoMedico.removeByName(nombreEquipo);
    if (filasEliminadas === 0) {
      return res.status(404).json({ msg: 'No se encontró un equipo con ese nombre para eliminar.' });
    }
    res.json({ msg: `Equipo "${nombreEquipo}" eliminado con éxito (${filasEliminadas} miembros removidos)` });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

/**
 * Elimina una entrada específica (un miembro) de un equipo por su ID de entrada.
 */
exports.eliminarMiembroEquipo = async (req, res) => {
  try {
    const resultado = await EquipoMedico.removeMemberById(req.params.id);
    if (resultado === 0) {
      return res.status(404).json({ msg: 'No se encontró la entrada del miembro del equipo.' });
    }
    res.json({ msg: 'Miembro eliminado del equipo con éxito' });
  } catch (error) {
    console.error('Error al eliminar miembro del equipo:', error);
    
    // Manejar específicamente el error de clave foránea
    if (error.code === '23503') {
      return res.status(400).json({ 
        msg: 'No se puede eliminar este miembro del equipo porque está asignado a una o más cirugías. Primero debe reasignar las cirugías a otro equipo médico.' 
      });
    }
    
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

exports.obtenerNombresEquipos = async (req, res) => {
  try {
    const equipos = await EquipoMedico.findAllTeamNames(); 
    res.json(equipos.map(e => e.nombre));
  } catch (error) {
    console.error('Error al obtener nombres de equipos:', error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};