const pool = require('../config/database');

const getBranches = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM branches ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addBranch = async (req, res) => {
  try {
    const { name, location } = req.body;

    const result = await pool.query(
      `INSERT INTO branches (name, location) VALUES ($1, $2) RETURNING *`,
      [name, location]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    const result = await pool.query(
      `UPDATE branches SET name = $1, location = $2 WHERE id = $3 RETURNING *`,
      [name, location, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM branches WHERE id = $1', [id]);
    res.json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getBranches, addBranch, updateBranch, deleteBranch };