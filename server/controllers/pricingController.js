const pool = require('../config/database');

const getCurrentPrice = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM current_pricing ORDER BY updated_at DESC LIMIT 1'
    );
    res.json(result.rows[0] || { amount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updatePrice = async (req, res) => {
  try {
    const { amount } = req.body;

    const result = await pool.query(
      `INSERT INTO current_pricing (amount) VALUES ($1) RETURNING *`,
      [amount]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getCurrentPrice, updatePrice };