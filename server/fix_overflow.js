const pool = require('./config/database');

async function fixOverflow() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Expand sales table columns
    await client.query('ALTER TABLE sales ALTER COLUMN sale_amount TYPE DECIMAL(20, 2)');
    await client.query('ALTER TABLE sales ALTER COLUMN discount TYPE DECIMAL(20, 2)');
    await client.query('ALTER TABLE sales ALTER COLUMN paid_amount TYPE DECIMAL(20, 2)');
    
    // Expand sale_items table columns
    await client.query('ALTER TABLE sale_items ALTER COLUMN weight_grams TYPE DECIMAL(20, 2)');
    await client.query('ALTER TABLE sale_items ALTER COLUMN price_per_gram TYPE DECIMAL(20, 2)');
    await client.query('ALTER TABLE sale_items ALTER COLUMN sub_total TYPE DECIMAL(20, 2)');
    await client.query('ALTER TABLE sale_items ALTER COLUMN discount TYPE DECIMAL(20, 2)');
    await client.query('ALTER TABLE sale_items ALTER COLUMN tax_amount TYPE DECIMAL(20, 2)');
    await client.query('ALTER TABLE sale_items ALTER COLUMN final_total TYPE DECIMAL(20, 2)');
    
    await client.query('COMMIT');
    console.log('Successfully expanded all numeric columns to DECIMAL(20, 2) to prevent overflow');
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('Error expanding columns:', e.message);
  } finally {
    client.release();
    process.exit(0);
  }
}
fixOverflow();
