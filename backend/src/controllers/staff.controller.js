const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllStaff = async (req, res) => {
  const clinic_id = req.query.clinic_id || req.user.clinic_id;  // selected clinic or token clinic
  if (!clinic_id) {
    return res.status(400).json({ message: 'clinic_id is required' });
  }
  try {
    const [rows] = await db.query(
      `SELECT staff_id, clinic_id, name, phone, email, role, approval_status, created_at 
       FROM Staff WHERE clinic_id = ? ORDER BY role, name`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addStaff = async (req, res) => {
  const clinic_id = req.body.clinic_id || req.user.clinic_id;  // selected clinic or token clinic
  const { name, phone, email, role, password } = req.body;
  if (!clinic_id) {
    return res.status(400).json({ message: 'clinic_id is required' });
  }
  try {
    // Use provided password or default to '123456'
    const rawPassword = password || '123456';
    const password_hash = await bcrypt.hash(rawPassword, 10);

    const [result] = await db.query(
      `INSERT INTO Staff (clinic_id, name, phone, email, role, password_hash, approval_status)
       VALUES (?, ?, ?, ?, ?, ?, 'APPROVED')`,
      [clinic_id, name, phone, email || null, role, password_hash]
    );
    res.status(201).json({
      message: 'Staff added successfully',
      staff_id: result.insertId,
      default_password: password ? undefined : '123456',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Approve/reject staff (for doctor use)
const updateStaffApproval = async (req, res) => {
  const { staff_id, status } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
  }
  try {
    await db.query('UPDATE Staff SET approval_status = ? WHERE staff_id = ?', [status, staff_id]);
    res.json({ message: `Staff ${status.toLowerCase()}.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getAllStaff, addStaff, updateStaffApproval };