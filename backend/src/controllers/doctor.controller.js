const db = require('../config/db');

// Get doctor profile
const getDoctorProfile = async (req, res) => {
  const doctor_id = req.user.id;
  try {
    const [rows] = await db.query(
      'SELECT doctor_id, name, specialization, phone, email FROM Doctor WHERE doctor_id = ?',
      [doctor_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get today's slots
const getTodaySlots = async (req, res) => {
  const { clinic_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM Slot 
       WHERE clinic_id = ? AND slot_date = CURDATE()
       ORDER BY slot_start_time ASC`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getDoctorProfile, getTodaySlots };