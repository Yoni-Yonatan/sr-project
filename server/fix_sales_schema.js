const pool = require('./config/database');

async function migrate() {
  try {
    await pool.query('ALTER TABLE sales ADD COLUMN discount DECIMAL(12, 2) DEFAULT 0');
    console.log('Added discount to sales');
    await pool.query('ALTER TABLE sales ADD COLUMN total_items INT DEFAULT 0');
    console.log('Added total_items to sales');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
        inventory_id INT REFERENCES inventory(id) ON DELETE SET NULL,
        item_name VARCHAR(255),
        karat VARCHAR(50),
        weight_grams DECIMAL(10, 2),
        price_per_gram DECIMAL(10, 2),
        sub_total DECIMAL(12, 2),
        discount DECIMAL(12, 2) DEFAULT 0,
        is_taxed BOOLEAN DEFAULT true,
        tax_amount DECIMAL(12, 2) DEFAULT 0,
        final_total DECIMAL(12, 2)
      )
    `);
    console.log('Created sale_items table');
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
