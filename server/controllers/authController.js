const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const signup = async (req, res) => {
  try {
    const { full_name, phone_number, password, branch_id, sales } = req.body;
    const photo = req.file ? req.file.filename : null;

    const userExists = await pool.query(
      'SELECT * FROM employees WHERE full_name = $1',
      [full_name]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
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

const login = async (req, res) => {
  try {
    const { full_name, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM employees WHERE full_name = $1 AND is_active = true',
      [full_name]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, full_name: user.full_name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone_number: user.phone_number,
        photo: user.photo,
        role: user.role,
        branch_id: user.branch_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { signup, login };