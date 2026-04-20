const db = require('../config/db');

// Register walk-in
const registerWalkIn = async (req, res) => {
  const { patient_id, doctor_id, clinic_id, priority, chief_complaint } = req.body;
  try {
    // Get next token number for today
    const [[{ token_count }]] = await db.query(
      `SELECT COUNT(*) as token_count FROM WalkIn 
       WHERE clinic_id = ? AND DATE(arrived_at) = CURDATE()`,
      [clinic_id]
    );

    const token_number = token_count + 1;

    const [result] = await db.query(
      `INSERT INTO WalkIn (patient_id, doctor_id, clinic_id, token_number, priority, status, chief_complaint)
       VALUES (?, ?, ?, ?, ?, 'WAITING', ?)`,
      [patient_id, doctor_id, clinic_id, token_number, priority || 'REGULAR', chief_complaint]
    );

    res.status(201).json({
      message: 'Walk-in registered',
      walkin_id: result.insertId,
      token_number
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get today's walk-ins
const getTodayWalkIns = async (req, res) => {
  const { clinic_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT w.walkin_id, w.token_number, w.priority, w.status, w.chief_complaint, w.arrived_at,
              p.name as patient_name, p.phone, p.age
       FROM WalkIn w
       JOIN Patient p ON w.patient_id = p.patient_id
       WHERE w.clinic_id = ? AND DATE(w.arrived_at) = CURDATE()
       ORDER BY w.priority DESC, w.arrived_at ASC`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update walk-in status
const updateWalkInStatus = async (req, res) => {
  const { walkin_id } = req.params;
  const { status } = req.body;
  try {
    await db.query(
      'UPDATE WalkIn SET status = ? WHERE walkin_id = ?',
      [status, walkin_id]
    );
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { registerWalkIn, getTodayWalkIns, updateWalkInStatus };