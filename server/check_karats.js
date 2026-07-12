const pool = require('./config/database');
pool.query("SELECT id, name FROM karats LIMIT 10")
  .then(r => console.table(r.rows))
  .catch(console.error)
  .finally(() => process.exit(0));
