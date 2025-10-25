// check-cirugias-structure.js
const db = require('./config/database');

async function checkCirugiasStructure() {
  try {
    console.log('🔍 Verificando estructura de tablas...');
    
    // Verificar columnas de la tabla cirugias
    const cirugiasColumns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'cirugias'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 COLUMNAS de tabla CIRUGIAS:');
    cirugiasColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Verificar columnas de la tabla quirofanos
    const quirofanosColumns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'quirofanos'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 COLUMNAS de tabla QUIROFANOS:');
    quirofanosColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Verificar columnas de la tabla pacientes
    const pacientesColumns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'pacientes'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 COLUMNAS de tabla PACIENTES:');
    pacientesColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  } finally {
    process.exit();
  }
}

checkCirugiasStructure();