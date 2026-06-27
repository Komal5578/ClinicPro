const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/generateToken');
const { sendSMS } = require('../services/sms.service');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const login = async (req, res) => {
  const { email, password, role } = req.body;
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : '';

  try {
    const roleConfig = {
      doctor:       { table: 'doctor', idColumn: 'doctor_id' },
      receptionist: { table: 'staff',  idColumn: 'staff_id'  },
    };

    const config = roleConfig[normalizedRole];
    if (!config) return res.status(400).json({ message: 'Invalid role' });

    console.log('--- LOGIN DEBUG ---');
    console.log('email:', email);
    console.log('role:', normalizedRole);
    console.log('table:', config.table);
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);

    const { data: rows, error } = await supabase
      .from(config.table)
      .select('*')
      .eq('email', email)
      .limit(1);

    console.log('supabase error:', error);
    console.log('rows:', JSON.stringify(rows));
    console.log('-------------------');

    if (error)
      return res.status(500).json({ message: 'Database error', error: error.message });

    if (!rows || rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = rows[0];

    if (!user.password_hash)
      return res.status(500).json({ message: 'User password hash missing' });

    const isBcryptHash = user.password_hash.startsWith('$2');
    const isMatch = isBcryptHash
      ? await bcrypt.compare(password, user.password_hash)
      : password === user.password_hash;

    console.log('isBcryptHash:', isBcryptHash);
    console.log('isMatch:', isMatch);

    if (!isMatch)
      return res.status(401).json({ message: 'Wrong password' });

    let clinicId = null;

    if (normalizedRole === 'doctor') {
      const { data: doctorClinicRows } = await supabase
        .from('doctor_clinic')
        .select('clinic_id')
        .eq('doctor_id', user.doctor_id)
        .limit(1);

      clinicId = doctorClinicRows?.length > 0 ? doctorClinicRows[0].clinic_id : null;

      if (!clinicId) {
        const { data: clinicRows } = await supabase
          .from('clinic')
          .select('clinic_id')
          .eq('doctor_id', user.doctor_id)
          .limit(1);
        clinicId = clinicRows?.length > 0 ? clinicRows[0].clinic_id : null;
      }
    } else if (normalizedRole === 'receptionist') {
      clinicId = user.clinic_id || null;
    }

    const token = generateToken({
      id: user[config.idColumn],
      role: normalizedRole,
      clinic_id: clinicId,
    });

    return res.json({
      token,
      user: {
        id: user[config.idColumn],
        name: user.name,
        role: normalizedRole,
        clinic_id: clinicId,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone || !/^\d{10}$/.test(phone))
    return res.status(400).json({ message: 'Valid 10-digit phone is required' });

  try {
    const { data: patients } = await supabase
      .from('patient')
      .select('patient_id')
      .eq('phone', phone)
      .limit(1);

    if (!patients || patients.length === 0)
      return res.status(404).json({ message: 'Patient not registered' });

    const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString().replace('Z', '+00:00');

    await supabase
      .from('otp_verification')
      .update({ is_used: true })
      .eq('phone', phone)
      .eq('is_used', false);

    await supabase
      .from('otp_verification')
      .insert([{ phone, otp, expires_at: expiresAt, is_used: false }]);

    await sendSMS(phone, otp);

    return res.json({ message: 'OTP sent', otp }); // add otp here
  } catch (err) {
    console.error('sendOtp error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !/^\d{10}$/.test(phone) || !otp)
    return res.status(400).json({ message: 'Phone and OTP are required' });

  try {
    const { data: otpRows } = await supabase
      .from('otp_verification')
      .select('otp_id, otp, expires_at, is_used')
      .eq('phone', phone)
      .eq('is_used', false)  // ← only get unused OTPs
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('OTP rows found:', otpRows);

    if (!otpRows || otpRows.length === 0)
      return res.status(400).json({ message: 'OTP not found. Please request a new OTP.' });

    const latestOtp = otpRows[0];

    console.log('OTP expiry:', latestOtp.expires_at);
    console.log('Now UTC:', new Date().toISOString());
    console.log('OTP value in DB:', latestOtp.otp, 'Entered:', otp);

    // Compare times properly
    const expiryStr = latestOtp.expires_at.endsWith('Z') || latestOtp.expires_at.includes('+') 
  ? latestOtp.expires_at 
  : latestOtp.expires_at + 'Z'; // force UTC if no timezone info
const expiryTime = new Date(expiryStr).getTime();
    const nowTime = new Date().getTime();

    if (expiryTime < nowTime) {
      console.log('EXPIRED - expiry:', expiryTime, 'now:', nowTime, 'diff:', expiryTime - nowTime);
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
    }

    if (String(latestOtp.otp) !== String(otp))
      return res.status(401).json({ message: 'Invalid OTP' });

    await supabase
      .from('otp_verification')
      .update({ is_used: true, verified_at: new Date().toISOString() })
      .eq('otp_id', latestOtp.otp_id);

    const { data: patients } = await supabase
      .from('patient')
      .select('patient_id, name, phone, age, email')
      .eq('phone', phone)
      .limit(1);

    if (!patients || patients.length === 0)
      return res.status(404).json({ message: 'Patient not registered' });

    const patient = patients[0];
    const token = generateToken({
      id: patient.patient_id,
      role: 'patient',
      patient_id: patient.patient_id,
    });

    return res.json({ token, patient });
  } catch (err) {
    console.error('verifyOtp error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { login, sendOtp, verifyOtp };