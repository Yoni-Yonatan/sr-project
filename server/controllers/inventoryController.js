const pool = require('../config/database');

const getInventory = async (req, res) => {
  try {
    const { karat, jewelry_type, status } = req.query;
    let query = `
      SELECT i.*, k.name as karat_name, 
             mc.name as main_category_name,
             sc.name as sub_category_name,
             st.name as specific_type_name,
             mc.jewelry_type
      FROM inventory i
      JOIN karats k ON i.karat_id = k.id
      LEFT JOIN categories mc ON i.main_category_id = mc.id
      LEFT JOIN categories sc ON i.sub_category_id = sc.id
      LEFT JOIN categories st ON i.specific_type_id = st.id
      WHERE 1=1
    `;
    const params = [];

    if (karat) {
      params.push(karat);
      query += ` AND i.karat_id = $${params.length}`;
    }

    if (jewelry_type) {
      params.push(jewelry_type);
      query += ` AND mc.jewelry_type = $${params.length}`;
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
    const { date, main_category_id, sub_category_id, specific_type_id, karat_id, base_price, weight_grams } = req.body;
    const image = req.file ? req.file.filename : null;

    // Get current price
    const priceResult = await pool.query(
      'SELECT amount FROM current_pricing ORDER BY updated_at DESC LIMIT 1'
    );
    const current_price = priceResult.rows[0]?.amount || base_price;

    const result = await pool.query(
      `INSERT INTO inventory (date, main_category_id, sub_category_id, specific_type_id, karat_id, base_price, current_price, weight_grams, image) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [date, main_category_id || null, sub_category_id || null, specific_type_id || null, karat_id, base_price, current_price, weight_grams, image]
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
    const { date, main_category_id, sub_category_id, specific_type_id, karat_id, base_price, weight_grams, is_sold } = req.body;
    const image = req.file ? req.file.filename : null;

    const fields = [
      'date = $1', 'main_category_id = $2', 'sub_category_id = $3', 
      'specific_type_id = $4', 'karat_id = $5', 'base_price = $6', 
      'weight_grams = $7', 'is_sold = $8'
    ];
    const values = [
      date, main_category_id || null, sub_category_id || null, 
      specific_type_id || null, karat_id, base_price, weight_grams, is_sold
    ];

    if (image) {
      fields.push(`image = $${values.length + 1}`);
      values.push(image);
    }
    values.push(id);

    const result = await pool.query(
      `UPDATE inventory SET ${fields.join(', ')} 
       WHERE id = $${values.length} RETURNING *`,
      values
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