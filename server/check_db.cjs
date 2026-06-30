const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, 'server', '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function checkDB() {
  try {
    console.log('Connected to PostgreSQL database');
    
    // Check if sales table exists
    const result = await pool.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'sales\''
    );
    console.log('Sales table exists:', result.rows.length > 0);
    
    if (result.rows.length > 0) {
      // Check sales data
      const salesCount = await pool.query('SELECT COUNT(*) FROM sales');
      console.log('Total sales:', salesCount.rows[0].count);
      
      // Check if inventory table exists
      const inventoryResult = await pool.query(
        'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'inventory\''
      );
      console.log('Inventory table exists:', inventoryResult.rows.length > 0);
      
      if (inventoryResult.rows.length > 0) {
        const inventoryCount = await pool.query('SELECT COUNT(*) FROM inventory');
        console.log('Total inventory items:', inventoryCount.rows[0].count);
        
        const soldInventory = await pool.query('SELECT COUNT(*) FROM inventory WHERE is_sold = true');
        console.log('Sold inventory items:', soldInventory.rows[0].count);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Database check error:', err);
    process.exit(1);
  }
}

checkDB();