const pool = require('../config/db');

const Usuario = {
 
  async findByCedula(cedula) {
    const query = `
      SELECT 
        mu.*, 
        r.descripcion AS role -- Usamos el alias 'role'
      FROM medicos_usuarios mu 
      LEFT JOIN roles r ON mu.id_rol = r.id_rol 
      WHERE LOWER(TRIM(mu.cedula_profecional)) = LOWER(TRIM($1))
    `;
    try {
      const { rows } = await pool.query(query, [cedula]);
      return rows[0];
    } catch (error) {
      console.error('Error al buscar por cédula:', error);
      throw error;
    }
  },

  async findById(id) {
    const query = `
      SELECT 
        mu.id_medicos, mu.nombre, mu.apellido_paterno, mu.apellido_materno,
        mu.cedula_profecional, mu.foto_perfil, mu.telefono,
        mu.id_rol, mu.id_especialidad,
        r.descripcion AS role,        -- Usamos el alias 'role'
        e.descripcion AS especialidad 
      FROM 
        medicos_usuarios mu
      LEFT JOIN roles r ON mu.id_rol = r.id_rol
      LEFT JOIN especialidades e ON mu.id_especialidad = e.id_especialidad
      WHERE mu.id_medicos = $1
    `;
    try {
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    } catch (error) {
      console.error('Error al buscar por ID:', error);
      throw error;
    }
  },

  async create(medicoData) {
    const {
      nombre, apellido_paterno, apellido_materno, 
      cedula_profecional, telefono, id_rol, id_especialidad, password
    } = medicoData;

    const query = `
      INSERT INTO medicos_usuarios (
        nombre, apellido_paterno, apellido_materno, 
        cedula_profecional, telefono, id_rol, id_especialidad, password
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    const values = [
      nombre, apellido_paterno, apellido_materno, 
      cedula_profecional, telefono, id_rol, id_especialidad, password
    ];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error al insertar médico en el modelo:', error);
      throw error;
    }
  },

  async findAll() {
    const query = `
      SELECT 
        mu.id_medicos, mu.nombre, mu.apellido_paterno, mu.apellido_materno,
        mu.cedula_profecional, mu.foto_perfil, mu.telefono,
        mu.id_rol, mu.id_especialidad,
        r.descripcion AS role, 
        e.descripcion AS especialidad 
      FROM 
        medicos_usuarios mu
      LEFT JOIN roles r ON mu.id_rol = r.id_rol
      LEFT JOIN especialidades e ON mu.id_especialidad = e.id_especialidad
      ORDER BY mu.id_medicos
    `;
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener todos los médicos:', error);
      throw error;
    }
  },


  async update(id, medicoData) {
    const {
      nombre, apellido_paterno, apellido_materno,
      cedula_profecional, telefono, id_rol, id_especialidad,
    } = medicoData;

    const query = `
      UPDATE medicos_usuarios 
      SET 
        nombre = $1, apellido_paterno = $2, apellido_materno = $3, 
        cedula_profecional = $4, telefono = $5, id_rol = $6, 
        id_especialidad = $7, actualizado_en = CURRENT_TIMESTAMP
      WHERE id_medicos = $8 
      RETURNING *
    `;
    const values = [
      nombre, apellido_paterno, apellido_materno, 
      cedula_profecional, telefono, id_rol, id_especialidad, id
    ];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error al actualizar médico en el modelo:', error);
      throw error;
    }
  },

  async remove(id) {
    const query = 'DELETE FROM medicos_usuarios WHERE id_medicos = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rowCount;
    } catch (error) {
      console.error('Error al eliminar médico en el modelo:', error);
      throw error;
    }
  },

  async updateFotoPerfil(id, fotoPath) {
    const query = 'UPDATE medicos_usuarios SET foto_perfil = $1 WHERE id_medicos = $2';
    try {
        await pool.query(query, [fotoPath, id]);
    } catch (error) {
        console.error('Error al actualizar foto de perfil:', error);
        throw error;
    }
  },

  async findEspecialistas() {
  const query = `
    SELECT 
      mu.id_medicos, mu.nombre, mu.apellido_paterno, mu.apellido_materno,
      mu.cedula_profecional, mu.foto_perfil, mu.telefono,
      mu.id_rol, mu.id_especialidad,
      r.descripcion AS role, 
      e.descripcion AS especialidad 
    FROM 
      medicos_usuarios mu
    LEFT JOIN roles r ON mu.id_rol = r.id_rol
    LEFT JOIN especialidades e ON mu.id_especialidad = e.id_especialidad
    ORDER BY mu.nombre, mu.apellido_paterno
  `;
  
  try {
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('Error al obtener especialistas en el modelo:', error);
    throw error;
  }
}
};

module.exports = Usuario;