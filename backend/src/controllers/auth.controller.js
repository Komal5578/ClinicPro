const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/generateToken');

const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let user = null;
    let table = '';

    if (role === 'doctor') {
      table = 'Doctor';
    } else if (role === 'receptionist') {
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

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    const token = generateToken({
      id: user.doctor_id || user.staff_id,
      role: role,
      clinic_id: user.clinic_id || null
    });

    res.json({
      token,
      user: {
        id: user.doctor_id || user.staff_id,
        name: user.name,
        role: role,
        clinic_id: user.clinic_id || null
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { login };