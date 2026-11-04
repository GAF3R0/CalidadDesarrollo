const pool = require('../config/db');
const { encryptSensitiveData } = require('../utils/cryptoService');

const ENCRYPTED_PREFIX = 'enc:v1:';

const encryptExistingDiagnoses = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      SELECT id_cirugia, diagnostico_pre, diagnostico_post
      FROM public.cirugias
      WHERE (diagnostico_pre IS NOT NULL AND diagnostico_pre NOT LIKE $1)
         OR (diagnostico_post IS NOT NULL AND diagnostico_post NOT LIKE $1)
      FOR UPDATE
    `, [`${ENCRYPTED_PREFIX}%`]);

    for (const cirugia of rows) {
      const diagnosticoPre = cirugia.diagnostico_pre?.startsWith(ENCRYPTED_PREFIX)
        ? cirugia.diagnostico_pre
        : encryptSensitiveData(cirugia.diagnostico_pre);
      const diagnosticoPost = cirugia.diagnostico_post?.startsWith(ENCRYPTED_PREFIX)
        ? cirugia.diagnostico_post
        : encryptSensitiveData(cirugia.diagnostico_post);

      await client.query(`
        UPDATE public.cirugias
        SET diagnostico_pre = $1, diagnostico_post = $2
        WHERE id_cirugia = $3
      `, [diagnosticoPre, diagnosticoPost, cirugia.id_cirugia]);
    }

    await client.query('COMMIT');
    console.log(`Diagnósticos existentes cifrados: ${rows.length}.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al cifrar diagnósticos existentes:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.pool.end();
  }
};

encryptExistingDiagnoses();
