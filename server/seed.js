const bcrypt = require('bcryptjs');
const pool = require('./config/database');
// database.js already loads dotenv with the correct path

async function seed() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash);
  
  // Update the admin user
  const result = await pool.query(
    'UPDATE employees SET password_hash = $1 WHERE id = 1 RETURNING id, full_name',
    [hash]
  );
  console.log('Updated user:', result.rows[0]);
  
  // Verify
  const user = await pool.query('SELECT * FROM employees WHERE id = 1');
  const match = await bcrypt.compare(password, user.rows[0].password_hash);
  console.log('Password verification:', match);
  
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
