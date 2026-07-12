const pool = require('./config/database');

async function migrate() {
  try {
    await pool.query('ALTER TABLE sales ADD COLUMN paid_amount DECIMAL(12, 2) DEFAULT 0');
    console.log('Added paid_amount to sales');
  } catch(e) {
    console.log('paid_amount might already exist', e.message);
  }

  try {
    await pool.query("ALTER TABLE sales ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Unpaid'");
    console.log('Added payment_status to sales');
  } catch(e) {
    console.log('payment_status might already exist', e.message);
  }
  process.exit(0);
}

migrate();
