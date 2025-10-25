const pool = require('../config/db');

const EquipoMedico = {

  async create(equipoData) {
    const { nombre, id_medico } = equipoData;
    const query = `
      INSERT INTO equipo_medico (nombre, id_medico) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    try {
      const { rows } = await pool.query(query, [nombre, id_medico]);
      return rows[0];
    } catch (error) {
      console.error('Error al crear equipo médico en el modelo:', error);
      throw error;
    }
  },

  async findByName(nombre) {
    const query = `
      SELECT 
        eq.id_equipomedico, 
        eq.nombre AS nombre_equipo, 
        mu.id_medicos,     
        mu.nombre AS medico_nombre, 
        mu.apellido_paterno, 
        mu.apellido_materno,
        e.descripcion AS especialidad 
      FROM equipo_medico eq
      LEFT JOIN medicos_usuarios mu ON eq.id_medico = mu.id_medicos
      LEFT JOIN especialidades e ON mu.id_especialidad = e.id_especialidad
      WHERE eq.nombre = $1
      ORDER BY mu.nombre
    `;
    try {
      const { rows } = await pool.query(query, [nombre]);
      return rows;
    } catch (error) {
      console.error('Error al buscar equipo por nombre:', error);
      throw error;
    }
  },

  async findAllTeamNames() {
    const query = 'SELECT DISTINCT nombre FROM equipo_medico ORDER BY nombre';
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener nombres de equipos:', error);
      throw error;
    }
  },

  async findAllEntries() {
    const query = `
      SELECT 
        eq.id_equipomedico, 
        eq.nombre AS nombre_equipo,
        eq.id_medico,
        mu.nombre AS medico_nombre,
        mu.apellido_paterno,
        mu.apellido_materno,
        e.descripcion AS especialidad
      FROM equipo_medico eq
      LEFT JOIN medicos_usuarios mu ON eq.id_medico = mu.id_medicos
      LEFT JOIN especialidades e ON mu.id_especialidad = e.id_especialidad
      ORDER BY eq.nombre, eq.id_equipomedico
    `;
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener todas las entradas de equipo:', error);
      throw error;
    }
  },

  async findCompleteTeams() {
    const query = `
      SELECT 
        eq.nombre AS nombre_equipo,
        eq.id_equipomedico,
        mu.id_medicos,
        mu.nombre AS medico_nombre,
        mu.apellido_paterno,
        mu.apellido_materno,
        e.descripcion AS especialidad
      FROM equipo_medico eq
      LEFT JOIN medicos_usuarios mu ON eq.id_medico = mu.id_medicos
      LEFT JOIN especialidades e ON mu.id_especialidad = e.id_especialidad
      ORDER BY eq.nombre, mu.nombre
    `;
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener equipos completos:', error);
      throw error;
    }
  },

  async countMembersByTeam() {
    const query = `
      SELECT 
        nombre AS nombre_equipo,
        COUNT(*) AS total_miembros,
        COUNT(id_medico) AS medicos_asignados
      FROM equipo_medico 
      GROUP BY nombre 
      ORDER BY nombre
    `;
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error al contar miembros por equipo:', error);
      throw error;
    }
  },

  async findEmptyTeams() {
    const query = `
      SELECT DISTINCT
        nombre AS nombre_equipo
      FROM equipo_medico 
      WHERE id_medico IS NULL
      ORDER BY nombre
    `;
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener equipos vacíos:', error);
      throw error;
    }
  },

  async findByMedicoId(id_medico) {
    const query = `
      SELECT 
        eq.*,
        mu.nombre AS medico_nombre,
        mu.apellido_paterno,
        mu.apellido_materno
      FROM equipo_medico eq
      LEFT JOIN medicos_usuarios mu ON eq.id_medico = mu.id_medicos
      WHERE eq.id_medico = $1
    `;
    try {
      const { rows } = await pool.query(query, [id_medico]);
      return rows;
    } catch (error) {
      console.error('Error al buscar equipo por ID médico:', error);
      throw error;
    }
  },

  async update(id, equipoData) {
    const { id_medico } = equipoData;
    const query = `
      UPDATE equipo_medico 
      SET id_medico = $1 
      WHERE id_equipomedico = $2
      RETURNING *
    `;
    try {
      const { rows } = await pool.query(query, [id_medico, id]);
      return rows[0];
    } catch (error) {
      console.error('Error al actualizar equipo médico en el modelo:', error);
      throw error;
    }
  },

  async removeByName(nombre) {
    const query = 'DELETE FROM equipo_medico WHERE nombre = $1';
    try {
      const result = await pool.query(query, [nombre]);
      return result.rowCount; 
    } catch (error) {
      console.error('Error al eliminar equipo por nombre:', error);
      throw error;
    }
  },

  async removeMemberById(id) {
  const query = 'DELETE FROM equipo_medico WHERE id_equipomedico = $1';
  try {
    const result = await pool.query(query, [id]);
    return result.rowCount; 
  } catch (error) {
    console.error('Error al eliminar miembro por ID en el modelo:', error);
    throw error;
  }
  }

};

module.exports = EquipoMedico;