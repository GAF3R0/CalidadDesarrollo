const pool = require('../config/db');

const quirofano = {
  async allquirofanos() {
    const query = 'SELECT * FROM quirofanos ORDER BY sala';
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener todos los quirófanos:', error);
      throw error;
    }
  },

  async newquirofano(sala, estado) {
    const query = `
      INSERT INTO quirofanos (sala, estado) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    const values = [sala.trim(), estado];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error al insertar quirófano en el modelo:', error);
      throw error;
    }
  },

  async deletequirofano(sala) {
    const query = 'DELETE FROM quirofanos WHERE sala = $1';
    try {
      const result = await pool.query(query, [sala.trim()]);
      return result.rowCount;
    } catch (error) {
      console.error('Error al eliminar quirófano en el modelo:', error);
      throw error;
    }
  },

  async updatequirofano(sala, estado) {
    const salaNormalizada = sala.trim();
    const query = 'UPDATE quirofanos SET estado = $1 WHERE sala = $2 RETURNING *';
    const values = [estado, salaNormalizada];

    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('❌ Error al actualizar quirófano en el modelo:', error);
      throw error;
    }
  }
};

module.exports = quirofano;