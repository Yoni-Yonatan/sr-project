const pool = require('../config/database');

exports.checkDatabase = async (req, res) => {
  try {
    const dbNameRes = await pool.query('SELECT current_database() as name, current_user as user, version() as version');
    const dbInfo = dbNameRes.rows[0];

    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tableDetails = [];

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      try {
        const countRes = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        tableDetails.push({
          table: tableName,
          rowCount: parseInt(countRes.rows[0].count, 10)
        });
      } catch (err) {
        tableDetails.push({
          table: tableName,
          error: err.message
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Database connection is healthy',
      database: {
        name: dbInfo.name,
        user: dbInfo.user,
        version: dbInfo.version.split(' on ')[0]
      },
      tables: tableDetails
    });
  } catch (error) {
    console.error('Database connection check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect or query the database',
      error: error.message
    });
  }
};
