const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/generateToken');

const login = async (req, res) => {
  const { email, password, role } = req.body;
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : '';

  try {
    let user = null;
    let table = '';

    if (normalizedRole === 'doctor') {
      table = 'Doctor';
    } else if (normalizedRole === 'receptionist') {
      table = 'Staff';
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const [rows] = await db.query(
      `SELECT * FROM ${table} WHERE email = ?`, [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    user = rows[0];

    // Support both bcrypt-hashed and plain-text passwords
    const isBcryptHash = user.password_hash && user.password_hash.startsWith('$2');
    const isMatch = isBcryptHash
      ? await bcrypt.compare(password, user.password_hash)
      : password === user.password_hash;
    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    const token = generateToken({
      id: user.doctor_id || user.staff_id,
      role: normalizedRole,
      clinic_id: user.clinic_id || null
    });

    res.json({
      token,
      user: {
        id: user.doctor_id || user.staff_id,
        name: user.name,
        role: normalizedRole,
        clinic_id: user.clinic_id || null
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { login };