const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllStaff = async (req, res) => {
  const { clinic_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT user_id, name, email, role, is_active, created_at
       FROM User WHERE clinic_id = ? ORDER BY role, name`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addStaff = async (req, res) => {
  const { name, email, password, role, clinic_id } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO User (name, email, password_hash, role, clinic_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashed, role, clinic_id]
    );
    res.status(201).json({ message: 'Staff added', user_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const toggleStaffStatus = async (req, res) => {
  const { user_id } = req.params;
  try {
    await db.query(
      'UPDATE User SET is_active = NOT is_active WHERE user_id = ?',
      [user_id]
    );
    res.json({ message: 'Status toggled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getAllStaff, addStaff, toggleStaffStatus };