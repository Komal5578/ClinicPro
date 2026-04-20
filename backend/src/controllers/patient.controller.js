const db = require('../config/db');

// Search patient by phone
const searchPatient = async (req, res) => {
  const { phone } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT * FROM Patient WHERE phone = ?', [phone]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Register new patient
const registerPatient = async (req, res) => {
  const { name, age, phone, email } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Patient (name, age, phone, email) VALUES (?, ?, ?, ?)',
      [name, age, phone, email]
    );
    res.status(201).json({
      message: 'Patient registered',
      patient_id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { searchPatient, registerPatient };