const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.full_name, e.phone_number, e.photo, e.is_active, e.created_at, e.sales,
              b.name as branch_name, b.id as branch_id
       FROM employees e
       LEFT JOIN branches b ON e.branch_id = b.id
       ORDER BY e.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT e.id, e.full_name, e.phone_number, e.photo, e.is_active, e.sales,
              b.name as branch_name, b.id as branch_id
       FROM employees e
       LEFT JOIN branches b ON e.branch_id = b.id
       WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addEmployee = async (req, res) => {
  try {
    const { full_name, phone_number, password, branch_id, sales } = req.body;
    const photo = req.file ? req.file.filename : null;

    const userExists = await pool.query(
      'SELECT * FROM employees WHERE full_name = $1',
      [full_name]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Employee already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO employees (full_name, phone_number, photo, password_hash, branch_id, sales) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, phone_number, photo, branch_id, is_active, sales`,
      [full_name, phone_number, photo, hashedPassword, branch_id, sales || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone_number, branch_id, sales } = req.body;
    const photo = req.file ? req.file.filename : null;

    let query = `UPDATE employees SET full_name = $1, phone_number = $2, branch_id = $3, sales = $4`;
    let params = [full_name, phone_number, branch_id, sales || 0];

    if (photo) {
      query += `, photo = $${params.length + 1}`;
      params.push(photo);
    }

    query += ` WHERE id = $${params.length + 1} RETURNING id, full_name, phone_number, photo, branch_id, is_active, sales`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE employees SET is_active = NOT is_active 
       WHERE id = $1 RETURNING id, full_name, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  toggleEmployeeStatus
};