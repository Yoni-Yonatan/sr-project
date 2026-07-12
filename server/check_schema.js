const pool = require('./config/database');
pool.query("SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_name = 'inventory'")
  .then(r => console.table(r.rows))
  .catch(console.error)
  .finally(() => process.exit(0));
