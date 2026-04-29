const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/generateToken');
const { sendSMS } = require('../services/sms.service');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const ensureOtpTable = async () => {
  await db.query(
    `CREATE TABLE IF NOT EXISTS otp_verification (
      otp_id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(15) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at DATETIME NOT NULL,
      is_used TINYINT(1) NOT NULL DEFAULT 0,
      verified_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_otp_phone_created (phone, created_at)
    )`
  );
};


const login = async (req, res) => {
  const { email, password, role } = req.body;
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : '';

  try {
    const roleConfig = {
      doctor: { table: 'Doctor', idColumn: 'doctor_id' },
      receptionist: { table: 'Staff', idColumn: 'staff_id' },
    };

    const config = roleConfig[normalizedRole];
    if (!config) return res.status(400).json({ message: 'Invalid role' });

    const [rows] = await db.query(
      `SELECT * FROM ${config.table} WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];
    if (!user.password_hash) {
      return res.status(500).json({ message: 'User password hash missing' });
    }

    const isBcryptHash = user.password_hash?.startsWith('$2');
    const isMatch = isBcryptHash
      ? await bcrypt.compare(password, user.password_hash)
      : password === user.password_hash;

    if (!isMatch) return res.status(401).json({ message: 'Wrong password' });

    let clinicId = null;

    if (normalizedRole === 'doctor') {
      const [doctorClinicRows] = await db.query(
        'SELECT clinic_id FROM DoctorClinic WHERE doctor_id = ? LIMIT 1',
        [user.doctor_id]
      );

      clinicId = doctorClinicRows.length > 0 ? doctorClinicRows[0].clinic_id : null;

      if (!clinicId) {
        const [clinicRows] = await db.query(
          'SELECT clinic_id FROM Clinic WHERE doctor_id = ? LIMIT 1',
          [user.doctor_id]
        );
        clinicId = clinicRows.length > 0 ? clinicRows[0].clinic_id : null;
      }
    } else if (normalizedRole === 'receptionist') {
      clinicId = user.clinic_id || null;
    }

    const token = generateToken({
      id: user[config.idColumn],
      role: normalizedRole,
      clinic_id: clinicId
    });

    return res.json({
      token,
      user: {
        id: user[config.idColumn],
        name: user.name,
        role: normalizedRole,
        clinic_id: clinicId,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Valid 10-digit phone is required' });
  }

  try {
    await ensureOtpTable();

    const [patients] = await db.query(
      'SELECT patient_id FROM Patient WHERE phone = ? LIMIT 1',
      [phone]
    );

    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not registered' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      'UPDATE otp_verification SET is_used = 1 WHERE phone = ? AND is_used = 0',
      [phone]
    );

    await db.query(
      `INSERT INTO otp_verification (phone, otp, expires_at, is_used)
       VALUES (?, ?, ?, 0)`,
      [phone, otp, expiresAt]
    );

    await sendSMS(phone, otp);

    return res.json({ message: 'OTP sent' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !/^\d{10}$/.test(phone) || !otp) {
    return res.status(400).json({ message: 'Phone and OTP are required' });
  }

  try {
    await ensureOtpTable();

    const [otpRows] = await db.query(
      `SELECT otp_id, otp, expires_at, is_used
       FROM otp_verification
       WHERE phone = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ message: 'OTP not found. Please request a new OTP.' });
    }

    const latestOtp = otpRows[0];

    if (latestOtp.is_used) {
      return res.status(400).json({ message: 'OTP already used. Please request a new OTP.' });
    }

    if (new Date(latestOtp.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
    }

    if (String(latestOtp.otp) !== String(otp)) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    await db.query(
      'UPDATE otp_verification SET is_used = 1, verified_at = NOW() WHERE otp_id = ?',
      [latestOtp.otp_id]
    );

    const [patients] = await db.query(
      'SELECT patient_id, name, phone FROM Patient WHERE phone = ? LIMIT 1',
      [phone]
    );

    if (patients.length === 0) {
      return res.status(404).json({ message: 'Patient not registered' });
    }

    const patient = patients[0];
    const token = generateToken({
      id: patient.patient_id,
      role: 'patient',
      patient_id: patient.patient_id,
    });

    return res.json({ token, patient });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { login, sendOtp, verifyOtp };