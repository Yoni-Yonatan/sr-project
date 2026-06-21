const pool = require('../config/database');

const getKarats = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM karats ORDER BY jewelry_type, name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getKaratsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const result = await pool.query(
      'SELECT * FROM karats WHERE jewelry_type = $1 ORDER BY name',
      [type]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addKarat = async (req, res) => {
  try {
    const { jewelry_type, name } = req.body;

    const result = await pool.query(
      `INSERT INTO karats (jewelry_type, name) VALUES ($1, $2) RETURNING *`,
      [jewelry_type, name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateKarat = async (req, res) => {
  try {
    const { id } = req.params;
    const { jewelry_type, name } = req.body;

    const result = await pool.query(
      `UPDATE karats SET jewelry_type = $1, name = $2 WHERE id = $3 RETURNING *`,
      [jewelry_type, name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Karat not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteKarat = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM karats WHERE id = $1', [id]);
    res.json({ message: 'Karat deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getKarats, getKaratsByType, addKarat, updateKarat, deleteKarat };