const pool = require('../config/database');

const migrate = async () => {
  try {
    // Create sale_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
        inventory_id INT REFERENCES inventory(id),
        item_name VARCHAR(255) NOT NULL,
        karat VARCHAR(100),
        weight_grams DECIMAL(10, 3) NOT NULL,
        price_per_gram DECIMAL(12, 2) NOT NULL,
        sub_total DECIMAL(12, 2) NOT NULL,
        discount DECIMAL(12, 2) DEFAULT 0,
        is_taxed BOOLEAN DEFAULT true,
        tax_amount DECIMAL(12, 2) DEFAULT 0,
        final_total DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add discount column to sales table if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'sales' AND column_name = 'discount'
        ) THEN
          ALTER TABLE sales ADD COLUMN discount DECIMAL(12, 2) DEFAULT 0;
        END IF;
      END $$;
    `);

    // Add total_items column to sales table if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'sales' AND column_name = 'total_items'
        ) THEN
          ALTER TABLE sales ADD COLUMN total_items INT DEFAULT 1;
        END IF;
      END $$;
    `);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
