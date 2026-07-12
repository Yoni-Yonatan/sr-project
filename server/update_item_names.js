const pool = require('./config/database');

async function updateItemNames() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update sale_items item_name using inventory and categories
    const res = await client.query(`
      UPDATE sale_items si
      SET item_name = 
        COALESCE(mc.jewelry_type, 'Jewelry') || ' - ' || 
        COALESCE(mc.name, '') || 
        CASE WHEN sc.name IS NOT NULL THEN ' - ' || sc.name ELSE '' END
      FROM inventory i
      LEFT JOIN categories mc ON i.main_category_id = mc.id
      LEFT JOIN categories sc ON i.sub_category_id = sc.id
      WHERE si.inventory_id = i.id
    `);
    
    console.log(`Updated ${res.rowCount} sale items`);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating item names:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateItemNames();
