const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/generateToken');


const login = async (req, res) => {
  console.log('LOGIN ATTEMPT:', req.body);
  const { email, password, role } = req.body;
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : '';

  try {
    const tableMap = { doctor: 'doctor', receptionist: 'staff' };
    const table = tableMap[normalizedRole];
    console.log('Table:', table);

    if (!table) return res.status(400).json({ message: 'Invalid role' });

    const [columnRows] = await db.query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      [table]
    );
    console.log('Columns found:', columnRows.map(r => r.COLUMN_NAME));

    const columnSet = new Set(columnRows.map((row) => row.COLUMN_NAME));

    let loginColumn = 'email';
    let loginValue = email;

    if (!columnSet.has('email')) {
      console.log('No email column found in table');
      return res.status(500).json({ message: `Schema mismatch: ${table}.email missing` });
    }

    const [rows] = await db.query(
      `SELECT * FROM ${table} WHERE ${loginColumn} = ?`, [loginValue]
    );
    console.log('User rows found:', rows.length);

    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];
    console.log('User keys:', Object.keys(user));
    console.log('password_hash exists:', !!user.password_hash);
    console.log('password_hash starts with $2:', user.password_hash?.startsWith('$2'));

    const isBcryptHash = user.password_hash?.startsWith('$2');
    const isMatch = isBcryptHash
      ? await bcrypt.compare(password, user.password_hash)
      : password === user.password_hash;

    console.log('Password match:', isMatch);

    if (!isMatch) return res.status(401).json({ message: 'Wrong password' });

    const [doctorClinicRows] = await db.query(
      'SELECT clinic_id FROM doctorclinic WHERE doctor_id = ? LIMIT 1',
      [user.doctor_id]
    );
    console.log('DoctorClinic rows:', doctorClinicRows.length);

    let clinicId = doctorClinicRows.length > 0
      ? doctorClinicRows[0].clinic_id
      : null;

    if (!clinicId) {
      const [clinicRows] = await db.query(
        'SELECT clinic_id FROM clinic WHERE doctor_id = ? LIMIT 1',
        [user.doctor_id]
      );
      console.log('Clinic rows:', clinicRows.length);
      clinicId = clinicRows.length > 0 ? clinicRows[0].clinic_id : null;
    }

    console.log('Final clinicId:', clinicId);

    const token = generateToken({
      id: user.doctor_id,
      role: normalizedRole,
      clinic_id: clinicId
    });

    return res.json({
      token,
      user: { id: user.doctor_id, name: user.name, role: normalizedRole, clinic_id: clinicId }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
module.exports = { login };