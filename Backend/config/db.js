const { Pool, Query } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '192.168.1.70',
  database: process.env.DB_DATABASE || 'Gestion',
  password: process.env.DB_PASSWORD || 'Fernando1604',
  port: process.env.DB_PORT  || '5432',
  // Opciones adicionales para PostgreSQL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('connect', () => {
    console.log('Conectado a PostgreSQL');
});

pool.on('error', (err) =>{
    console.error('Error en la conexión de PostgreSQL :', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
}