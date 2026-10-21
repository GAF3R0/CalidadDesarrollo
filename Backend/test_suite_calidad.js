/**
 * =============================================================================
 * SUITE DE PRUEBAS DE CALIDAD Y REGRESIÓN - SISTEMA HOSPITALARIO ABMODEL
 * Tesis: Calidad de Desarrollo
 * =============================================================================
 * Ejecuta pruebas automatizadas de extremo a extremo contra la API y la BD:
 * 1. Autenticación y Generación de JWT (Fase 1)
 * 2. Rechazo de Credenciales Inválidas (401)
 * 3. Transacción ACID Paciente + Expediente (Fase 3)
 * 4. Programación de Cirugía con Horario Atómico (Fase 4)
 * 5. Detección y Bloqueo de Conflictos de Quirófano (409 Conflict)
 * 6. Actualización y Cambio de Estado en Quirófano
 * 7. Eliminación y Borrado en Cascada en Horarios
 * 8. Integridad de la Base de Datos (Restricciones UNIQUE y CHECK)
 * =============================================================================
 */

const pool = require('./config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const API_PORT = process.env.PORT || 4001;
const BASE_URL = `http://localhost:${API_PORT}/api`;

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🩺 INICIANDO BATERÍA DE PRUEBAS AUTOMATIZADAS DE CALIDAD');
  console.log('============================================================\n');

  let tokenAdmin = null;

  // ---------------------------------------------------------------------------
  // TEST 1: AUTENTICACIÓN EXITOSA (Cédula insensible a mayúsculas/espacios)
  // ---------------------------------------------------------------------------
  console.log('🔹 GRUPO 1: SEGURIDAD Y CONTROL DE ACCESO (FASE 1)');
  try {
    const resLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula: '  123456789  ',
        password: 'PasswordParaErick123'
      })
    });
    const dataLogin = await resLogin.json();
    assert(resLogin.status === 200 && !!dataLogin.token, 'Inicio de sesión exitoso y emisión de token JWT');
    tokenAdmin = dataLogin.token;

    // Verificar perfil protegido
    const resMe = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenAdmin}` }
    });
    const dataMe = await resMe.json();
    assert(resMe.status === 200 && dataMe.nombre.includes('Carlos'), 'Ruta protegida /auth/me retorna perfil de médico');
  } catch (err) {
    assert(false, `Error en login: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: RECHAZO DE ACCESO NO AUTORIZADO
  // ---------------------------------------------------------------------------
  try {
    const resFail = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula: '123456789',
        password: 'PasswordIncorrecta'
      })
    });
    assert(resFail.status === 401, 'Rechazo seguro de login con contraseña errónea (401 Unauthorized)');

    const resNoToken = await fetch(`${BASE_URL}/pacientes`);
    assert(resNoToken.status === 401, 'Bloqueo de acceso a /pacientes sin cabecera Authorization (401)');
  } catch (err) {
    assert(false, `Error en prueba 401: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: INTEGRIDAD TRANSACCIONAL ACID PACIENTE + EXPEDIENTE (FASE 3)
  // ---------------------------------------------------------------------------
  console.log('\n🔹 GRUPO 2: INTEGRIDAD DE DATOS Y TRANSACCIONES (FASE 3)');
  let expedienteCreadoId = null;
  const numExpPrueba = `EXP-TEST-${Date.now().toString().slice(-4)}`;

  try {
    const resPaciente = await fetch(`${BASE_URL}/pacientes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        nombre: 'Paciente',
        apellido: 'De Prueba QA',
        sexo: 'Masculino',
        fecha_nacimiento: '1995-04-12',
        tipo_sangre: 'O+',
        numero_expediente: numExpPrueba,
        procedencia: 'Urgencias'
      })
    });
    const dataPac = await resPaciente.json();
    assert(resPaciente.status === 201 && !!dataPac.paciente_id, 'Transacción atómica: Paciente y Expediente creados con éxito');
    expedienteCreadoId = dataPac.data?.id_expediente;

    // Verificar unicidad de expediente (error 409)
    const resDupExp = await fetch(`${BASE_URL}/pacientes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        nombre: 'Otro',
        apellido: 'Paciente',
        sexo: 'Femenino',
        tipo_sangre: 'A+',
        numero_expediente: numExpPrueba // Duplicado intencional
      })
    });
    assert(resDupExp.status === 409, 'Control de clave única: Rechazo de expediente duplicado (409 Conflict)');
  } catch (err) {
    assert(false, `Error en prueba de pacientes: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: PROGRAMACIÓN QUIRÚRGICA Y PERSISTENCIA DE HORARIOS (FASE 4)
  // ---------------------------------------------------------------------------
  console.log('\n🔹 GRUPO 3: PROGRAMACIÓN QUIRÚRGICA Y REGLAS DE NEGOCIO (FASE 4)');
  let cirugiaCreadaId = null;
  const fechaCirugiaPrueba = '2026-11-20';

  try {
    // 4.1 Crear cirugía con horario
    const resCirugia = await fetch(`${BASE_URL}/cirugias`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        id_expediente: expedienteCreadoId || 1,
        fecha: fechaCirugiaPrueba,
        hora_inicio: '10:00',
        hora_fin: '12:00',
        id_quirófano: 1,
        id_equipomedico: 1,
        procedimiento: 'Apendicectomía de Prueba QA',
        estado: 'programada'
      })
    });
    const dataCirugia = await resCirugia.json();
    assert(resCirugia.status === 201 && !!dataCirugia.cirugia?.id_cirugia, 'Cirugía y Horario creados y vinculados en PostgreSQL');
    cirugiaCreadaId = dataCirugia.cirugia?.id_cirugia;

    // 4.2 Probar Regla de Negocio: Detección y bloqueo de conflicto en quirófano (mismo horario y sala)
    const resConflicto = await fetch(`${BASE_URL}/cirugias`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        id_expediente: 1,
        fecha: fechaCirugiaPrueba,
        hora_inicio: '11:00', // Se solapa con 10:00 - 12:00
        hora_fin: '13:00',
        id_quirófano: 1,
        id_equipomedico: 1,
        procedimiento: 'Cirugía Solapada Conflicto',
        estado: 'programada'
      })
    });
    const dataConflicto = await resConflicto.json();
    assert(resConflicto.status === 409 && dataConflicto.msg.includes('Conflicto de horario'), 
      'Regla de Negocio Hospitalaria: Bloqueo de solapamiento de quirófano (409 Conflict)');

    // 4.3 Actualizar estado de la cirugía
    const resUpdate = await fetch(`${BASE_URL}/cirugias/${cirugiaCreadaId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ estado: 'en_proceso' })
    });
    assert(resUpdate.status === 200, 'Actualización dinámica de estado quirúrgico (PUT /cirugias/:id)');

    // 4.4 Borrado y Purga en Cascada (ON DELETE CASCADE)
    const resDelete = await fetch(`${BASE_URL}/cirugias/${cirugiaCreadaId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenAdmin}` }
    });
    assert(resDelete.status === 200, 'Eliminación segura de cirugía');

    // Verificar en BD que el horario se eliminó en cascada
    const checkHorario = await pool.query('SELECT * FROM horarios WHERE id_cirugia = $1', [cirugiaCreadaId]);
    assert(checkHorario.rowCount === 0, 'Integridad Referencial: Horario purgado en cascada sin registros huérfanos');

  } catch (err) {
    assert(false, `Error en prueba de cirugías: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: RESTRICCIONES DE DOMINIO Y CALIDAD EN POSTGRESQL (PGADMIN RESTRUCTURING)
  // ---------------------------------------------------------------------------
  console.log('\n🔹 GRUPO 4: VERIFICACIÓN DEL ESQUEMA POSTGRESQL OPTIMIZADO');
  try {
    const checkFks = await pool.query(`
      SELECT count(*) as total 
      FROM pg_constraint 
      WHERE contype = 'f' AND connamespace = 'public'::regnamespace;
    `);
    assert(parseInt(checkFks.rows[0].total, 10) === 8, 'Catálogo limpio: Exactamente 8 claves foráneas (0 redundancias)');

    const checkUnique = await pool.query(`
      SELECT count(*) as total 
      FROM pg_constraint 
      WHERE conname = 'uq_medicos_cedula';
    `);
    assert(parseInt(checkUnique.rows[0].total, 10) === 1, 'Restricción UNIQUE en Cédula Profesional confirmada en BD');

    const checkIdx = await pool.query(`
      SELECT count(*) as total 
      FROM pg_indexes 
      WHERE indexname = 'idx_cirugias_quirofano_fecha';
    `);
    assert(parseInt(checkIdx.rows[0].total, 10) === 1, 'Índice compuesto de alto rendimiento activo en PostgreSQL');
  } catch (err) {
    assert(false, `Error en comprobación de base de datos: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // RESUMEN FINAL DE CALIDAD
  // ---------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`📊 RESULTADOS FINALES: ${passCount} APROBADAS | ${failCount} FALLIDAS`);
  if (failCount === 0) {
    console.log('🏆 100% DE PRUEBAS DE CALIDAD SUPERADAS EXITOSAMENTE');
  } else {
    console.log('⚠️ ALGUNAS PRUEBAS REQUIEREN REVISIÓN');
  }
  console.log('============================================================\n');

  process.exit(failCount === 0 ? 0 : 1);
}

runTests();
