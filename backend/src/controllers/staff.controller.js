const db = require('../config/db');

const getAllStaff = async (req, res) => {
  const clinic_id = req.user.clinic_id;  // from token
  try {
    const [rows] = await db.query(
      `SELECT staff_id, clinic_id, name, phone, role, created_at 
       FROM Staff WHERE clinic_id = ? ORDER BY role, name`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addStaff = async (req, res) => {
  const clinic_id = req.user.clinic_id;  // from token
  const { name, phone, role } = req.body;  // clinic_id removed from body
  try {
    const [result] = await db.query(
      `INSERT INTO Staff (clinic_id, name, phone, role)
       VALUES (?, ?, ?, ?)`,
      [clinic_id, name, phone, role]
    );
    res.status(201).json({ message: 'Staff added', staff_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getAllStaff, addStaff };