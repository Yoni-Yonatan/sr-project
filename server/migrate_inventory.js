const pool = require('./config/database');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE inventory
      ADD COLUMN image VARCHAR(255);
    `);
    console.log("Added image column.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
