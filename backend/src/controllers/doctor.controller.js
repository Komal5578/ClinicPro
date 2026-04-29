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

const getDoctorClinics = async (req, res) => {
  const doctor_id = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT c.clinic_id, c.clinic_name, c.address, c.sector, c.gst_number,
              c.morning_start, c.morning_end, c.evening_start, c.evening_end,
              c.booked_slot_duration, c.buffer_duration
       FROM DoctorClinic dc
       JOIN Clinic c ON c.clinic_id = dc.clinic_id
       WHERE dc.doctor_id = ?
       ORDER BY c.clinic_name ASC`,
      [doctor_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get today's slots
const getTodaySlots = async (req, res) => {
  const { clinic_id } = req.query;
  if (!clinic_id) {
    return res.status(400).json({ message: 'clinic_id is required' });
  }
  try {
    const [rows] = await db.query(
      `SELECT slot_id, clinic_id, slot_date, slot_start_time, slot_type, status, token_number
       FROM Slot
       WHERE clinic_id = ? AND slot_date = CURDATE()
       ORDER BY slot_start_time ASC`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Generate slots for a day
const generateSlots = async (req, res) => {
  const { clinic_id, date, booked_duration, buffer_duration, booked_ratio } = req.body;
  if (!clinic_id) {
    return res.status(400).json({ message: 'clinic_id is required' });
  }
  if (!date) {
    return res.status(400).json({ message: 'date is required' });
  }
  try {
    await db.query('CALL generate_slots(?, ?, ?, ?, ?)', [
      clinic_id,
      date,
      booked_duration || 20,
      buffer_duration || 15,
      booked_ratio || 0.6,
    ]);

    await db.query(
      'UPDATE Clinic SET booked_slot_duration = ?, buffer_duration = ? WHERE clinic_id = ?',
      [booked_duration || 20, buffer_duration || 15, clinic_id]
    );

    res.json({ success: true, message: 'Slots generated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Set doctor delay status
const setDoctorStatus = async (req, res) => {
  const { clinic_id, status, message } = req.body;
  if (!clinic_id) {
    return res.status(400).json({ message: 'clinic_id is required' });
  }
  if (!status) {
    return res.status(400).json({ message: 'status is required' });
  }
  try {
    await db.query(
      `UPDATE Clinic
       SET is_delayed = ?,
           delay_minutes = ?,
           delay_message = ?,
           delay_announced_at = ?
       WHERE clinic_id = ?`,
      [status === 'DELAYED', status === 'DELAYED' ? 15 : 0, message || null, status === 'DELAYED' ? new Date() : null, clinic_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Insert urgent patient and cascade delay
const insertUrgentPatient = async (req, res) => {
  const { clinic_id, patient_id, chief_complaint, after_slot_id, delay_minutes } = req.body;
  const delay = delay_minutes || 20;

  try {
    const [walkin] = await db.query(
      `INSERT INTO WalkIn (patient_id, doctor_id, clinic_id, token_number, priority, status, chief_complaint)
       SELECT ?, doctor_id, ?,
         (SELECT COALESCE(MAX(token_number), 0) + 1 FROM WalkIn WHERE clinic_id = ? AND DATE(arrived_at) = CURDATE()),
         'URGENT', 'WAITING', ?
       FROM DoctorClinic WHERE clinic_id = ? LIMIT 1`,
      [patient_id, clinic_id, clinic_id, chief_complaint, clinic_id]
    );

    await db.query('CALL cascade_urgent_delay(?, ?, ?)', [clinic_id, delay, after_slot_id || 0]);

    res.json({ success: true, walkin_id: walkin.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get clinic status for patient portal
const getClinicStatus = async (req, res) => {
  const { clinic_id } = req.query;
  if (!clinic_id) {
    return res.status(400).json({ message: 'clinic_id is required' });
  }
  try {
    const [rows] = await db.query(
      'SELECT is_delayed, delay_minutes, delay_message, delay_announced_at FROM Clinic WHERE clinic_id = ?',
      [clinic_id]
    );

    res.json(rows[0] || { is_delayed: false, delay_minutes: 0, delay_message: null, delay_announced_at: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDoctorProfile,
  getDoctorClinics,
  getTodaySlots,
  setDoctorStatus,
  insertUrgentPatient,
  getClinicStatus,
};