const db = require('../config/db');

// Get today's appointments
const getTodayAppointments = async (req, res) => {
  const { clinic_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT a.appointment_id, a.status, a.booked_at,
              p.name as patient_name, p.phone, p.age,
              s.slot_start_time, s.slot_date
       FROM Appointment a
       JOIN Patient p ON a.patient_id = p.patient_id
       JOIN Slot s ON a.slot_id = s.slot_id
       WHERE a.clinic_id = ? AND s.slot_date = CURDATE()
       ORDER BY s.slot_start_time ASC`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Book appointment using stored procedure
const bookAppointment = async (req, res) => {
  const { slot_id, patient_id, doctor_id, clinic_id } = req.body;
  try {
    await db.query('CALL book_appointment(?, ?, ?, ?, @appt_id, @msg)',
      [slot_id, patient_id, doctor_id, clinic_id]
    );
    const [[result]] = await db.query('SELECT @appt_id as appointment_id, @msg as message');

    if (result.message !== 'SUCCESS') {
      return res.status(400).json({ message: result.message });
    }

    res.status(201).json({
      message: 'Appointment booked',
      appointment_id: result.appointment_id
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getTodayAppointments, bookAppointment };