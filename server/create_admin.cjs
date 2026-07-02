const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function createAdmin() {
  try {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // First check if any employees exist
    const existing = await pool.query('SELECT COUNT(*) FROM employees');
    console.log('Existing employees:', existing.rows[0].count);
    
    // Create admin user
    const result = await pool.query(
      `INSERT INTO employees (full_name, phone_number, password_hash, role, branch_id, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, role`,
      ['Admin', '1234567890', hashedPassword, 'admin', 1, true]
    );
    
    console.log('Created admin user:', result.rows[0]);
    console.log('Password:', password);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdmin();