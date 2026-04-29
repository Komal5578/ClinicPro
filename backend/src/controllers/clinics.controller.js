const db = require('../config/db');

const getPublicClinics = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.clinic_id, c.clinic_name, c.address, c.sector, c.latitude, c.longitude,
             c.morning_start, c.morning_end, c.evening_start, c.evening_end,
             c.booked_slot_duration, c.gst_number,
             d.name as doctor_name, d.specialization, d.nmc_verified
      FROM Clinic c
      LEFT JOIN doctorclinic dc ON c.clinic_id = dc.clinic_id
      LEFT JOIN doctor d ON dc.doctor_id = d.doctor_id
      ORDER BY c.clinic_name ASC
    `);
    console.log('Clinics fetched:', rows.length);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getNearbyClinics = async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required' });
  try {
    const [rows] = await db.query(`
      SELECT c.clinic_id, c.clinic_name, c.address, c.sector, c.latitude, c.longitude,
             c.morning_start, c.morning_end, c.evening_start, c.evening_end,
             c.booked_slot_duration,
             d.name as doctor_name, d.specialization, d.nmc_verified,
             (6371 * acos(cos(radians(?)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(?)) + sin(radians(?)) * sin(radians(c.latitude)))) AS distance
      FROM Clinic c
      LEFT JOIN doctorclinic dc ON c.clinic_id = dc.clinic_id
      LEFT JOIN doctor d ON dc.doctor_id = d.doctor_id
      WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
      HAVING distance < ?
      ORDER BY distance ASC
    `, [lat, lng, lat, radius]);
    res.json(rows);
  } catch (err) {
    console.error('getNearbyClinics ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getRecentClinics = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  try {
    const [rows] = await db.query(`
      SELECT c.clinic_id, c.clinic_name, c.address, c.sector, c.latitude, c.longitude,
             c.morning_start, c.morning_end, c.evening_start, c.evening_end,
             c.booked_slot_duration, c.gst_number, d.name as doctor_name
      FROM Clinic c
      LEFT JOIN DoctorClinic dc ON c.clinic_id = dc.clinic_id
      LEFT JOIN Doctor d ON dc.doctor_id = d.doctor_id
      ORDER BY c.clinic_id DESC
      LIMIT ?
    `, [limit]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getPublicSlots = async (req, res) => {
  const { clinic_id, date } = req.query;
  if (!clinic_id) return res.status(400).json({ message: 'clinic_id is required' });
  const slotDate = date || new Date().toISOString().split('T')[0];
  try {
    const [rows] = await db.query(
      `SELECT slot_id, clinic_id, slot_date, slot_start_time, slot_type, status, token_number
       FROM Slot
       WHERE clinic_id = ? AND slot_date = ?
       ORDER BY slot_start_time ASC`,
      [clinic_id, slotDate]
    );
    res.json(rows);
  } catch (err) {
    console.error('getPublicSlots ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getClinicStatus = async (req, res) => {
  const clinic_id = req.params.clinic_id || req.query.clinic_id;
  if (!clinic_id) return res.status(400).json({ message: 'clinic_id is required' });
  try {
    const [rows] = await db.query(
      `SELECT is_delayed, delay_minutes, delay_message, delay_announced_at
       FROM Clinic WHERE clinic_id = ?`,
      [clinic_id]
    );
    res.json(rows[0] || { is_delayed: false, delay_minutes: 0, delay_message: null, delay_announced_at: null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getPublicClinics, getNearbyClinics, getRecentClinics, getPublicSlots, getClinicStatus };
