const pool = require('../config/database');

const getInventory = async (req, res) => {
  try {
    const { karat, jewelry_type, status } = req.query;
    let query = `
      SELECT i.*, k.name as karat_name, c.name as category_name,
             c.jewelry_type
      FROM inventory i
      JOIN karats k ON i.karat_id = k.id
      JOIN categories c ON i.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (karat) {
      params.push(karat);
      query += ` AND i.karat_id = $${params.length}`;
    }

    if (jewelry_type) {
      params.push(jewelry_type);
      query += ` AND c.jewelry_type = $${params.length}`;
    }

    if (status === 'sold') {
      query += ` AND i.is_sold = true`;
    } else if (status === 'in_stock') {
      query += ` AND i.is_sold = false`;
    }

    query += ` ORDER BY i.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addInventory = async (req, res) => {
  try {
    const { date, category_id, karat_id, base_price, weight_grams } = req.body;

    // Get current price
    const priceResult = await pool.query(
      'SELECT amount FROM current_pricing ORDER BY updated_at DESC LIMIT 1'
    );
    const current_price = priceResult.rows[0]?.amount || base_price;

    const result = await pool.query(
      `INSERT INTO inventory (date, category_id, karat_id, base_price, current_price, weight_grams) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [date, category_id, karat_id, base_price, current_price, weight_grams]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, category_id, karat_id, base_price, weight_grams, is_sold } = req.body;

    const result = await pool.query(
      `UPDATE inventory SET date = $1, category_id = $2, karat_id = $3, 
       base_price = $4, weight_grams = $5, is_sold = $6 
       WHERE id = $7 RETURNING *`,
      [date, category_id, karat_id, base_price, weight_grams, is_sold, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inventory WHERE id = $1', [id]);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getInventory, addInventory, updateInventory, deleteInventory };