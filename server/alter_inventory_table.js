const pool = require('./config/database');

async function addImageColumn() {
  try {
    console.log('Adding image column to inventory table...');
    const result = await pool.query(`
      ALTER TABLE inventory ADD COLUMN IF NOT EXISTS image TEXT;
    `);
    console.log('Successfully added image column to inventory table.');
    
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory';
    `);
    console.log('Current columns in inventory:', res.rows);

  } catch (err) {
    console.error('Error adding image column:', err);
  } finally {
    pool.end();
  }
}

addImageColumn();
