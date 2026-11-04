const pool = require('./config/db');
const bcrypt = require('bcryptjs');

const hashearYActualizar = async () => {
  try {
    const { PASSWORD_RESET_CEDULA, PASSWORD_RESET_VALUE } = process.env;
    if (!PASSWORD_RESET_CEDULA || !PASSWORD_RESET_VALUE) {
      throw new Error('Configura PASSWORD_RESET_CEDULA y PASSWORD_RESET_VALUE localmente.');
    }

    console.log('Iniciando el proceso de hasheo de contraseñas...');
    const passwordHash = await bcrypt.hash(PASSWORD_RESET_VALUE, 12);
    const result = await pool.query(
      'UPDATE medicos_usuarios SET password = $1 WHERE cedula_profecional = $2',
      [passwordHash, PASSWORD_RESET_CEDULA]
    );
    if (result.rowCount === 0) {
      throw new Error('No se encontró un usuario con la cédula indicada.');
    }
    console.log('Contraseña actualizada correctamente.');
  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
    process.exitCode = 1;
  } finally {
    await pool.pool.end();
  }
};

hashearYActualizar();