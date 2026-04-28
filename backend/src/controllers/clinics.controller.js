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
    console.error('getPublicClinics ERROR:', err.message);
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

module.exports = { getPublicClinics, getNearbyClinics };