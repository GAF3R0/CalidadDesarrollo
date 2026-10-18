const pool = require('../config/db');

const Cirugia = {
  /**
   * Verifica si existe conflicto/solapamiento de horario en un quirófano para una fecha dada.
   */
  async checkConflictoHorario({ id_quirofano, fecha, hora_inicio, hora_fin, id_cirugia_excluir }) {
    if (!id_quirofano || !fecha || !hora_inicio || !hora_fin) return null;

    const query = `
      SELECT 
        ci.id_cirugia, 
        ci.procedimiento, 
        q.sala, 
        h.hora_inicio, 
        h.hora_fin
      FROM cirugias ci
      JOIN horarios h ON ci.id_cirugia = h.id_cirugia
      JOIN quirofanos q ON ci."id_quirófano" = q."id_quirófano"
      WHERE ci."id_quirófano" = $1
        AND ci.fecha = $2::date
        AND LOWER(ci.estado) NOT IN ('cancelada', 'completada')
        AND ($3::int IS NULL OR ci.id_cirugia != $3::int)
        AND (h.hora_inicio < $5::time AND h.hora_fin > $4::time)
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [
      id_quirofano, 
      fecha, 
      id_cirugia_excluir || null, 
      hora_inicio, 
      hora_fin
    ]);
    return rows[0] || null;
  },

  /**
   * Crea una nueva cirugía en la base de datos y su horario correspondiente de forma atómica (ACID).
   */
  async create(cirugiaData) {
    const {
      id_expediente, fecha, diagnostico_pre, procedimiento,
      id_quirófano, id_equipomedico, estado,
      diagnostico_post, resultado, creado_por,
      hora_inicio, hora_fin
    } = cirugiaData;

    const fechaCirugia = fecha ? new Date(fecha) : new Date(); 

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const queryCirugia = `
        INSERT INTO cirugias (
          id_expediente, fecha, diagnostico_pre, procedimiento, 
          id_quirófano, id_equipomedico, estado, diagnostico_post, resultado, creado_por
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *
      `;
      const valuesCirugia = [
        id_expediente, fechaCirugia, diagnostico_pre, procedimiento,
        id_quirófano, id_equipomedico, estado || 'Programada',
        diagnostico_post, resultado, creado_por || 'sistema'
      ];

      const { rows } = await client.query(queryCirugia, valuesCirugia);
      const nuevaCirugia = rows[0];

      // Si se proporcionó horario de inicio y fin, se registra en la tabla horarios
      if (hora_inicio && hora_fin) {
        const queryHorario = `
          INSERT INTO horarios (id_cirugia, hora_inicio, hora_fin)
          VALUES ($1, $2, $3)
          RETURNING id_horario, hora_inicio, hora_fin
        `;
        const resHorario = await client.query(queryHorario, [
          nuevaCirugia.id_cirugia, 
          hora_inicio, 
          hora_fin
        ]);
        nuevaCirugia.horario = resHorario.rows[0];
        nuevaCirugia.hora_inicio = resHorario.rows[0].hora_inicio;
        nuevaCirugia.hora_fin = resHorario.rows[0].hora_fin;
      }

      await client.query('COMMIT');
      return nuevaCirugia;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al insertar cirugía en el modelo con transacción:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Obtiene todas las cirugías con detalles de tablas relacionadas, incluyendo horarios y médico.
   */
  async findAllDetailed() {
    const query = `
      SELECT 
        ci.id_cirugia,
        ci.id_expediente,
        ci.fecha,
        ci.estado,
        ci."id_quirófano",
        ci.id_equipomedico,
        ex.numero_expediente,
        p.nombre AS paciente_nombre,
        p.apellido AS paciente_apellido,
        ci.diagnostico_pre,
        ci.procedimiento,
        q.sala AS quirofano_sala,
        eq.nombre AS equipo_nombre,
        (m.nombre || ' ' || m.apellido_paterno) AS medico_principal,
        h.id_horario,
        h.hora_inicio,
        h.hora_fin,
        ci.diagnostico_post,
        ci.resultado
      FROM cirugias ci 
      LEFT JOIN expedientes ex ON ci.id_expediente = ex.id_expediente
      LEFT JOIN pacientes p ON ex.id_paciente = p.id_paciente
      LEFT JOIN quirofanos q ON ci."id_quirófano" = q."id_quirófano"
      LEFT JOIN equipo_medico eq ON ci.id_equipomedico = eq.id_equipomedico
      LEFT JOIN medicos_usuarios m ON eq.id_medico = m.id_medicos
      LEFT JOIN horarios h ON ci.id_cirugia = h.id_cirugia
      ORDER BY ci.fecha DESC, h.hora_inicio ASC NULLS LAST, ci.id_cirugia DESC;
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
   * Busca una cirugía por su ID.
   */
  async findById(id) {
    const query = `
      SELECT 
        ci.*,
        h.id_horario,
        h.hora_inicio,
        h.hora_fin
      FROM cirugias ci
      LEFT JOIN horarios h ON ci.id_cirugia = h.id_cirugia
      WHERE ci.id_cirugia = $1
    `;
    try {
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error al buscar cirugía con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza una cirugía existente y su horario asociado.
   */
  async update(id, cirugiaData) {
    const {
      fecha, diagnostico_pre, procedimiento, id_quirófano, 
      id_equipomedico, estado, diagnostico_post, resultado,
      hora_inicio, hora_fin
    } = cirugiaData;
    
    const fechaCirugia = fecha ? new Date(fecha) : undefined; 

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const fields = [];
      const values = [];
      let queryIndex = 1;

      if (fechaCirugia !== undefined) { fields.push(`fecha = $${queryIndex++}`); values.push(fechaCirugia); }
      if (diagnostico_pre !== undefined) { fields.push(`diagnostico_pre = $${queryIndex++}`); values.push(diagnostico_pre); }
      if (procedimiento !== undefined) { fields.push(`procedimiento = $${queryIndex++}`); values.push(procedimiento); }
      if (id_quirófano !== undefined) { fields.push(`"id_quirófano" = $${queryIndex++}`); values.push(id_quirófano); }
      if (id_equipomedico !== undefined) { fields.push(`id_equipomedico = $${queryIndex++}`); values.push(id_equipomedico); }
      if (estado !== undefined) { fields.push(`estado = $${queryIndex++}`); values.push(estado); }
      if (diagnostico_post !== undefined) { fields.push(`diagnostico_post = $${queryIndex++}`); values.push(diagnostico_post); }
      if (resultado !== undefined) { fields.push(`resultado = $${queryIndex++}`); values.push(resultado); }
      
      let cirugiaActualizada = null;

      if (fields.length > 0) {
        fields.push(`actualizado_en = CURRENT_TIMESTAMP`);
        values.push(id);

        const queryUpdate = `
          UPDATE cirugias 
          SET ${fields.join(', ')} 
          WHERE id_cirugia = $${queryIndex}
          RETURNING *
        `;
        const resCirugia = await client.query(queryUpdate, values);
        cirugiaActualizada = resCirugia.rows[0];
      }

      // Actualizar o insertar horario si se proporcionan horas
      if (hora_inicio && hora_fin) {
        const existeHorario = await client.query('SELECT id_horario FROM horarios WHERE id_cirugia = $1', [id]);
        if (existeHorario.rows.length > 0) {
          await client.query(`
            UPDATE horarios 
            SET hora_inicio = $1, hora_fin = $2, actualizado_en = CURRENT_TIMESTAMP 
            WHERE id_cirugia = $3
          `, [hora_inicio, hora_fin, id]);
        } else {
          await client.query(`
            INSERT INTO horarios (id_cirugia, hora_inicio, hora_fin) 
            VALUES ($1, $2, $3)
          `, [id, hora_inicio, hora_fin]);
        }
      }

      await client.query('COMMIT');

      return cirugiaActualizada || (await this.findById(id));
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar cirugía en el modelo:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Elimina una cirugía y sus horarios asociados de forma transaccional.
   */
  async remove(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM horarios WHERE id_cirugia = $1', [id]);
      const result = await client.query('DELETE FROM cirugias WHERE id_cirugia = $1', [id]);
      await client.query('COMMIT');
      return result.rowCount;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al eliminar cirugía en el modelo:', error);
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = Cirugia;