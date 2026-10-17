const pool = require('../config/db');

const Cirugia = {
  /**
   * Crea una nueva cirugía en la base de datos.
   */
  async create(cirugiaData) {
    const {
      id_expediente, fecha, diagnostico_pre, procedimiento,
      id_quirófano, id_equipomedico, estado, // Estado viene del formulario
      // Otros campos que podrían venir del frontend (aunque no estén en el INSERT de ejemplo)
      diagnostico_post, resultado, creado_por
    } = cirugiaData;

    // Aseguramos que la fecha tenga el formato correcto si viene como string
    const fechaCirugia = fecha ? new Date(fecha) : new Date(); 

    const query = `
      INSERT INTO cirugias (
        id_expediente, fecha, diagnostico_pre, procedimiento, 
        id_quirófano, id_equipomedico, estado, diagnostico_post, resultado, creado_por
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *
    `;
    const values = [
      id_expediente, fechaCirugia, diagnostico_pre, procedimiento,
      id_quirófano, id_equipomedico, estado || 'Programada', // Valor por defecto si no viene
      diagnostico_post, resultado, creado_por || 'sistema'
    ];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error al insertar cirugía en el modelo:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las cirugías con detalles de tablas relacionadas.
   */
  async findAllDetailed() {
    const query = `
      SELECT 
        ci.id_cirugia,
        ci.fecha,
        ci.estado,
        ex.numero_expediente,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        ci.diagnostico_pre,
        ci.procedimiento,
        q.sala AS quirofano_sala,
        eq.nombre AS equipo_nombre,
        ci.diagnostico_post,
        ci.resultado
      FROM cirugias ci 
      LEFT JOIN expedientes ex ON ci.id_expediente = ex.id_expediente
      LEFT JOIN pacientes p ON ex.id_paciente = p.id_paciente
      LEFT JOIN quirofanos q ON ci."id_quirófano" = q."id_quirófano"
      LEFT JOIN equipo_medico eq ON ci.id_equipomedico = eq.id_equipomedico
      ORDER BY ci.fecha DESC, ci.id_cirugia DESC;
    `;
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener cirugías detalladas:', error);
      throw error;
    }
  },

  /**
   * Busca una cirugía por su ID (útil para actualizar o ver detalles específicos).
   */
    async findById(id) {
        const query = 'SELECT * FROM cirugias WHERE id_cirugia = $1';
        try {
            const { rows } = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error(`Error al buscar cirugía con ID ${id}:`, error);
            throw error;
        }
    },

  /**
   * Actualiza una cirugía existente por su ID.
   */
  async update(id, cirugiaData) {
    const {
      fecha, diagnostico_pre, procedimiento, id_quirófano, 
      id_equipomedico, estado, diagnostico_post, resultado
    } = cirugiaData;
    
    // Aseguramos que la fecha tenga el formato correcto
    const fechaCirugia = fecha ? new Date(fecha) : undefined; 

    // Construimos la consulta dinámicamente para actualizar solo los campos presentes
    const fields = [];
    const values = [];
    let queryIndex = 1;

    if (fechaCirugia !== undefined) { fields.push(`fecha = $${queryIndex++}`); values.push(fechaCirugia); }
    if (diagnostico_pre !== undefined) { fields.push(`diagnostico_pre = $${queryIndex++}`); values.push(diagnostico_pre); }
    if (procedimiento !== undefined) { fields.push(`procedimiento = $${queryIndex++}`); values.push(procedimiento); }
    if (id_quirófano !== undefined) { fields.push(`id_quirófano = $${queryIndex++}`); values.push(id_quirófano); }
    if (id_equipomedico !== undefined) { fields.push(`id_equipomedico = $${queryIndex++}`); values.push(id_equipomedico); }
    if (estado !== undefined) { fields.push(`estado = $${queryIndex++}`); values.push(estado); }
    if (diagnostico_post !== undefined) { fields.push(`diagnostico_post = $${queryIndex++}`); values.push(diagnostico_post); }
    if (resultado !== undefined) { fields.push(`resultado = $${queryIndex++}`); values.push(resultado); }
    
    // Si no hay campos para actualizar, no hacemos nada
    if (fields.length === 0) {
        return this.findById(id); // Devolvemos el registro sin cambios
    }

    fields.push(`actualizado_en = CURRENT_TIMESTAMP`); // Siempre actualizamos la fecha de modificación
    values.push(id); // El ID va al final para la cláusula WHERE

    const query = `
      UPDATE cirugias 
      SET ${fields.join(', ')} 
      WHERE id_cirugia = $${queryIndex}
      RETURNING *
    `;

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error al actualizar cirugía en el modelo:', error);
      throw error;
    }
  },

  /**
   * Elimina una cirugía por su ID.
   */
  async remove(id) {
    const query = 'DELETE FROM cirugias WHERE id_cirugia = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount; // Devuelve 1 si se eliminó, 0 si no se encontró
    } catch (error) {
      console.error('Error al eliminar cirugía en el modelo:', error);
      throw error;
    }
  }
};

module.exports = Cirugia;