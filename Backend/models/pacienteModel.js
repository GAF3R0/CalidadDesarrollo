const pool = require('../config/db');

const Paciente = {
  /**
   * Inserta un paciente y su expediente clínico dentro de una transacción ACID atómica.
   * Si cualquiera de las dos operaciones falla, se revierte todo (ROLLBACK).
   */
  async insertPacienteConExpediente(nombre, apellido, sexo, fecha_nacimiento, tipo_sangre, numero_expediente, procedencia) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const queryPaciente = `
        INSERT INTO pacientes (nombre, apellido, sexo, fecha_nacimiento, tipo_sangre, activo) 
        VALUES ($1, $2, $3, $4, $5, true) 
        RETURNING id_paciente, nombre, apellido, sexo, fecha_nacimiento, tipo_sangre
      `;
      const resultPaciente = await client.query(queryPaciente, [
        nombre, apellido, sexo || null, fecha_nacimiento || null, tipo_sangre
      ]);
      const nuevoPaciente = resultPaciente.rows[0];

      const queryExpediente = `
        INSERT INTO expedientes (id_paciente, numero_expediente, procedencia) 
        VALUES ($1, $2, $3)
        RETURNING id_expediente, numero_expediente, procedencia
      `;
      const resultExpediente = await client.query(queryExpediente, [
        nuevoPaciente.id_paciente, numero_expediente, procedencia || null
      ]);

      await client.query('COMMIT');

      return {
        paciente_id: nuevoPaciente.id_paciente,
        id_expediente: resultExpediente.rows[0].id_expediente,
        paciente: {
          ...nuevoPaciente,
          ...resultExpediente.rows[0]
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error en transacción al insertar paciente y expediente:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Obtiene todos los pacientes activos con su información completa de expediente.
   */
  async findPacientes() {
    const query = `
      SELECT 
        pa.id_paciente,
        pa.nombre,
        pa.apellido,
        pa.sexo,
        pa.fecha_nacimiento,
        pa.tipo_sangre,
        e.id_expediente,
        e.numero_expediente,
        e.procedencia
      FROM pacientes pa 
      INNER JOIN expedientes e ON pa.id_paciente = e.id_paciente
      WHERE pa.activo = true
      ORDER BY pa.nombre, pa.apellido;
    `;
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener lista de pacientes:', error);
      throw error;
    }
  },

  /**
   * Obtiene un paciente por su ID.
   */
  async findById(id_paciente) {
    const query = `
      SELECT 
        pa.id_paciente,
        pa.nombre,
        pa.apellido,
        pa.sexo,
        pa.fecha_nacimiento,
        pa.tipo_sangre,
        e.id_expediente,
        e.numero_expediente,
        e.procedencia
      FROM pacientes pa 
      INNER JOIN expedientes e ON pa.id_paciente = e.id_paciente
      WHERE pa.id_paciente = $1 AND pa.activo = true;
    `;
    try {
      const result = await pool.query(query, [id_paciente]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error al buscar paciente con ID ${id_paciente}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza los datos del paciente y su expediente dentro de una transacción ACID.
   */
  async updatePaciente(id_paciente, datos) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const queryPaciente = `
        UPDATE pacientes 
        SET nombre = $1, apellido = $2, sexo = $3, fecha_nacimiento = $4, tipo_sangre = $5
        WHERE id_paciente = $6 AND activo = true
        RETURNING *
      `;
      const resultPaciente = await client.query(queryPaciente, [
        datos.nombre, datos.apellido, datos.sexo || null, datos.fecha_nacimiento || null, datos.tipo_sangre, id_paciente
      ]);

      if (resultPaciente.rowCount === 0) {
        await client.query('ROLLBACK');
        return { notFound: true };
      }

      const queryExpediente = `
        UPDATE expedientes 
        SET numero_expediente = $1, procedencia = $2
        WHERE id_paciente = $3
        RETURNING *
      `;
      await client.query(queryExpediente, [
        datos.numero_expediente, datos.procedencia || null, id_paciente
      ]);

      await client.query('COMMIT');
      return { success: true, paciente: resultPaciente.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error en transacción al actualizar paciente y expediente:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Borrado lógico (Soft delete) para preservar el historial clínico legal y evitar violaciones de clave foránea.
   */
  async deletePaciente(id_paciente) {
    const query = 'UPDATE pacientes SET activo = false WHERE id_paciente = $1 AND activo = true RETURNING id_paciente';
    try {
      const result = await pool.query(query, [id_paciente]);
      return { deleted: result.rowCount > 0 };
    } catch (error) {
      console.error('Error al realizar borrado lógico del paciente:', error);
      throw error;
    }
  }
};

module.exports = Paciente;