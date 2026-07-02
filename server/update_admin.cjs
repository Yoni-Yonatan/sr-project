const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function updateAdmin() {
  try {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get all employees
    const result = await pool.query('SELECT id, full_name, role FROM employees');
    console.log('Existing employees:', result.rows);
    
    // Update the first employee to be admin with known password
    const update = await pool.query(
      `UPDATE employees SET password_hash = $1, role = 'admin', is_active = true WHERE id = 1 RETURNING id, full_name, role`,
      [hashedPassword]
    );
    
    console.log('Updated admin user:', update.rows[0]);
    console.log('Login with: Admin / password123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateAdmin();