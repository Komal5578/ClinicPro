const db = require('../config/db');
const bcrypt = require('bcryptjs');

const registerDoctor = async (req, res) => {
  const {
    name, email, phone, password, sector, registrationType,
    registrationNumber, slotDuration, morningStart, morningEnd,
    eveningStart, eveningEnd, gst_number, clinic_name, address,
  } = req.body;

  try {
    // Check if doctor email already exists
    const [existing] = await db.query('SELECT doctor_id FROM Doctor WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'A doctor with this email already exists' });
    }

    // Check if GST already registered
    const [existingClinic] = await db.query('SELECT clinic_id FROM Clinic WHERE gst_number = ?', [gst_number]);
    if (existingClinic.length > 0) {
      return res.status(409).json({ message: 'A clinic with this GST number is already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Insert Doctor
    const [doctorResult] = await db.query(
      `INSERT INTO Doctor (name, email, phone, password_hash, specialization, registration_no, sector, registration_type, nmc_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, password_hash, sector, registrationNumber, sector, registrationType, true]
    );
    const doctor_id = doctorResult.insertId;

    // Insert Clinic
    const [clinicResult] = await db.query(
      `INSERT INTO Clinic (doctor_id, clinic_name, address, gst_number, sector, morning_start, morning_end, evening_start, evening_end, booked_slot_duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [doctor_id, clinic_name, address, gst_number, sector, morningStart, morningEnd, eveningStart, eveningEnd, slotDuration || 20]
    );
    const clinic_id = clinicResult.insertId;

    // Insert DoctorClinic mapping
    await db.query('INSERT INTO DoctorClinic (doctor_id, clinic_id) VALUES (?, ?)', [doctor_id, clinic_id]);

    res.status(201).json({
      message: 'Doctor and clinic registered successfully',
      doctor_id,
      clinic_id,
    });
  } catch (err) {
    console.error('Doctor registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const registerReceptionist = async (req, res) => {
  const { name, email, phone, password, gst_number } = req.body;

  try {
    // Find clinic by GST
    const [clinics] = await db.query('SELECT clinic_id FROM Clinic WHERE gst_number = ?', [gst_number]);
    if (clinics.length === 0) {
      return res.status(404).json({ message: 'No clinic found with this GST number. Doctor must register first.' });
    }
    const clinic_id = clinics[0].clinic_id;

    // Check if email already exists in Staff
    const [existing] = await db.query('SELECT staff_id FROM Staff WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Staff with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO Staff (clinic_id, name, phone, email, role, password_hash, approval_status)
       VALUES (?, ?, ?, ?, 'RECEPTIONIST', ?, 'PENDING')`,
      [clinic_id, name, phone, email, password_hash]
    );

    res.status(201).json({ message: 'Registration submitted. Awaiting doctor approval.' });
  } catch (err) {
    console.error('Receptionist registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { registerDoctor, registerReceptionist };
