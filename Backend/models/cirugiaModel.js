const pool = require('../config/db');

const Cirugia = {
  async create(cirugiaData) {
    const { 
      id_expediente,
      fecha, 
      diagnostico_pre, 
      diagnostico_post, 
      procedimiento, 
      resultado, 
      id_quirófano, 
      id_equipomedico, 
      estado 
    } = cirugiaData;

    const query = `
      INSERT INTO cirugias 
        (id_expediente, fecha, diagnostico_pre, diagnostico_post, procedimiento, resultado, id_quirófano, id_equipomedico, estado) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `;
    
    const values = [
      id_expediente, 
      fecha, 
      diagnostico_pre || '', 
      diagnostico_post || '', 
      procedimiento, 
      resultado || '', 
      id_quirófano, 
      id_equipomedico, 
      estado || 'programada'
    ];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error al crear cirugía en el modelo:', error);
      throw error;
    }
  },

  async findAllDetailed() {
    const query = `
      SELECT 
        c.id_cirugia,
        c.id_expediente,
        c.fecha,
        c.diagnostico_pre,
        c.diagnostico_post,
        c.procedimiento,
        c.resultado,
        c.id_quirófano,
        c.id_equipomedico,
        c.estado,
        c.creado_en,
        c.actualizado_en,
        c.creado_por,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        eq.nombre as equipo_nombre,
        q.sala as quirofano_sala  -- CORREGIDO: q.nombre → q.sala
      FROM cirugias c
      LEFT JOIN pacientes p ON c.id_expediente = p.id_paciente
      LEFT JOIN equipo_medico eq ON c.id_equipomedico = eq.id_equipomedico
      LEFT JOIN quirofanos q ON c.id_quirófano = q.id_quirófano
      ORDER BY c.fecha DESC
    `;
    
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error en findAllDetailed:', error);
      throw error;
    }
  },

  async findById(id) {
    const query = `
      SELECT 
        c.id_cirugia,
        c.id_expediente,
        c.fecha,
        c.diagnostico_pre,
        c.diagnostico_post,
        c.procedimiento,
        c.resultado,
        c.id_quirófano,
        c.id_equipomedico,
        c.estado,
        c.creado_en,
        c.actualizado_en,
        c.creado_por,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido,
        eq.nombre as equipo_nombre,
        q.sala as quirofano_sala  -- CORREGIDO: q.nombre → q.sala
      FROM cirugias c
      LEFT JOIN pacientes p ON c.id_expediente = p.id_paciente
      LEFT JOIN equipo_medico eq ON c.id_equipomedico = eq.id_equipomedico
      LEFT JOIN quirofanos q ON c.id_quirófano = q.id_quirófano
      WHERE c.id_cirugia = $1
    `;
    
    try {
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      console.error('Error al buscar cirugía por ID:', error);
      throw error;
    }
  },

  async update(id, cirugiaData) {
    const { 
      id_expediente, 
      fecha, 
      diagnostico_pre, 
      diagnostico_post, 
      procedimiento, 
      resultado, 
      id_quirófano, 
      id_equipomedico, 
      estado 
    } = cirugiaData;

    const query = `
      UPDATE cirugias 
      SET id_expediente = $1, 
          fecha = $2, 
          diagnostico_pre = $3, 
          diagnostico_post = $4, 
          procedimiento = $5, 
          resultado = $6, 
          id_quirófano = $7, 
          id_equipomedico = $8, 
          estado = $9, 
          actualizado_en = CURRENT_TIMESTAMP
      WHERE id_cirugia = $10
      RETURNING *
    `;
    
    const values = [
      id_expediente, 
      fecha, 
      diagnostico_pre, 
      diagnostico_post, 
      procedimiento, 
      resultado, 
      id_quirófano, 
      id_equipomedico, 
      estado, 
      id
    ];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error al actualizar cirugía en el modelo:', error);
      throw error;
    }
  },

  async remove(id) {
    const query = 'DELETE FROM cirugias WHERE id_cirugia = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount;
    } catch (error) {
      console.error('Error al eliminar cirugía en el modelo:', error);
      throw error;
    }
  }
};

module.exports = Cirugia;