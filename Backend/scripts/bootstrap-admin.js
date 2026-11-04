const bcrypt = require('bcryptjs');
const readline = require('node:readline');
const pool = require('../config/db');

const prompt = (question) =>
  new Promise((resolve) => {
    const terminal = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    terminal.question(question, (answer) => {
      terminal.close();
      resolve(answer.trim());
    });
  });

const promptHidden = (question) =>
  new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
      reject(new Error('Este comando requiere una terminal interactiva para proteger la contraseña.'));
      return;
    }

    let answer = '';
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('keypress', onKeypress);
        process.stdout.write('\n');
        reject(new Error('Operación cancelada.'));
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('keypress', onKeypress);
        process.stdout.write('\n');
        resolve(answer);
        return;
      }

      if (key.name === 'backspace') {
        answer = answer.slice(0, -1);
        return;
      }

      if (!key.ctrl && !key.meta && character) {
        answer += character;
      }
    };

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', onKeypress);
    process.stdout.write(question);
  });

const bootstrapAdmin = async () => {
  const firstName = await prompt('Nombre: ');
  const lastName = await prompt('Apellido paterno: ');
  const professionalId = await prompt('Cédula profesional: ');
  const { rows: specialties } = await pool.query(
    'SELECT id_especialidad, descripcion FROM public.especialidades ORDER BY descripcion'
  );

  if (specialties.length === 0) {
    throw new Error('No hay especialidades registradas en la base de datos.');
  }

  console.log('\nEspecialidades disponibles:');
  specialties.forEach((specialty, index) => {
    console.log(`${index + 1}. ${specialty.descripcion}`);
  });

  const specialtyChoice = Number(await prompt('Elige el número de especialidad: '));
  if (!Number.isInteger(specialtyChoice) || specialtyChoice < 1 || specialtyChoice > specialties.length) {
    throw new Error('La selección de especialidad no es válida.');
  }
  const specialty = specialties[specialtyChoice - 1];

  const password = await promptHidden('Contraseña (mínimo 12 caracteres, no se mostrará): ');
  if (password.length < 12) {
    throw new Error('La contraseña debe tener al menos 12 caracteres.');
  }

  const confirmation = await promptHidden('Confirma la contraseña: ');
  if (password !== confirmation) {
    throw new Error('Las contraseñas no coinciden.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('bootstrap-admin'))");

    const { rows: existingUsers } = await client.query(
      'SELECT COUNT(*)::int AS total FROM public.medicos_usuarios'
    );
    if (existingUsers[0].total !== 0) {
      throw new Error(
        'El bootstrap solo se permite cuando no hay usuarios registrados. Usa la administración normal para agregar cuentas.'
      );
    }

    const { rows: adminRoles } = await client.query(
      "SELECT id_rol FROM public.roles WHERE LOWER(TRIM(descripcion)) = 'administrador'"
    );
    if (adminRoles.length !== 1) {
      throw new Error('Se requiere exactamente un rol Administrador en la base de datos.');
    }

    const { rows } = await client.query(
      `INSERT INTO public.medicos_usuarios
        (nombre, apellido_paterno, cedula_profecional, id_rol, id_especialidad, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_medicos`,
      [
        firstName,
        lastName,
        professionalId,
        adminRoles[0].id_rol,
        specialty.id_especialidad,
        passwordHash
      ]
    );

    await client.query('COMMIT');
    console.log(`Administrador creado correctamente (ID ${rows[0].id_medicos}). Ya puedes iniciar sesión.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

bootstrapAdmin()
  .catch((error) => {
    console.error(`No se pudo crear el administrador: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.pool.end());
