const pool = require('./config/database');

const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        employee_id INT REFERENCES employees(id),
        inventory_id INT REFERENCES inventory(id),
        sale_date DATE DEFAULT CURRENT_DATE,
        sale_amount DECIMAL(12, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Sales table created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating sales table:', err);
    process.exit(1);
  }
};

createTable();
