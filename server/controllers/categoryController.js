const pool = require('../config/database');

const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
              CASE WHEN c.parent_id IS NULL THEN 'Root' 
                   ELSE pc.name 
              END as parent_name
       FROM categories c
       LEFT JOIN categories pc ON c.parent_id = pc.id
       ORDER BY c.jewelry_type, c.level, c.name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addCategory = async (req, res) => {
  try {
    const { jewelry_type, category_name, level, parent_id, name } = req.body;
    const image = req.file ? req.file.filename : null;

    const result = await pool.query(
      `INSERT INTO categories (jewelry_type, category_name, level, parent_id, name) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [jewelry_type, category_name, level, parent_id || null, name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { jewelry_type, category_name, level, parent_id, name } = req.body;
    const image = req.file ? req.file.filename : null;

    // Build dynamic update query
    const fields = ['jewelry_type = $1', 'category_name = $2', 'level = $3', 'parent_id = $4', 'name = $5'];
    const values = [jewelry_type, category_name, level, parent_id || null, name];
    values.push(id);

    const result = await pool.query(
      `UPDATE categories SET ${fields.join(', ')} 
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if has children
    const children = await pool.query(
      'SELECT id FROM categories WHERE parent_id = $1',
      [id]
    );

    if (children.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with sub-items. Delete children first.' 
      });
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getCategories, addCategory, updateCategory, deleteCategory };