const pool = require('./config/database');
pool.query("SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL LIMIT 10")
  .then(r => console.table(r.rows))
  .catch(console.error)
  .finally(() => process.exit(0));
