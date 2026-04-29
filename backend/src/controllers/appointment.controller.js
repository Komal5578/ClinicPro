const db = require('../config/db');

// Get today's appointments
const getTodayAppointments = async (req, res) => {
  const { clinic_id } = req.query;
  try {
    const supabase = require('../config/supabase');
    
    const { data: appointments, error } = await supabase
      .from('appointment')
      .select(`
        appointment_id,
        status,
        booked_at,
        patient:patient_id (
          name,
          phone,
          age
        ),
        slot:slot_id (
          slot_start_time,
          slot_date,
          slot_type,
          token_number
        )
      `)
      .eq('clinic_id', clinic_id)
      .eq('slot.slot_date', 'today');  // Note: use RPC or CURRENT_DATE for dynamic

    if (error) throw error;

    // Transform for frontend
    const rows = appointments.map(appt => ({
      appointment_id: appt.appointment_id,
      status: appt.status,
      booked_at: appt.booked_at,
      patient_name: appt.patient.name,
      phone: appt.patient.phone,
      age: appt.patient.age,
      slot_start_time: appt.slot.slot_start_time,
      slot_date: appt.slot.slot_date,
      slot_type: appt.slot.slot_type,
      token_number: appt.slot.token_number
    })).sort((a, b) => a.token_number - b.token_number);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get upcoming appointments from today onward
const getUpcomingAppointments = async (req, res) => {
  const { clinic_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT a.appointment_id, a.status, a.booked_at,
              p.name as patient_name, p.phone, p.age,
              s.slot_start_time, s.slot_date, s.slot_type, s.token_number
       FROM Appointment a
       JOIN Patient p ON a.patient_id = p.patient_id
       JOIN Slot s ON a.slot_id = s.slot_id
       WHERE a.clinic_id = ? AND s.slot_date >= CURDATE()
       ORDER BY s.slot_date ASC, s.token_number ASC, s.slot_start_time ASC`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const resolveDoctorForClinic = async (clinic_id) => {
  const [rows] = await db.query(
    `SELECT dc.doctor_id
     FROM DoctorClinic dc
     WHERE dc.clinic_id = ?
     ORDER BY dc.doctor_id ASC
     LIMIT 1`,
    [clinic_id]
  );

  if (rows.length > 0) {
    return rows[0].doctor_id;
  }

  const [clinicRows] = await db.query('SELECT doctor_id FROM Clinic WHERE clinic_id = ?', [clinic_id]);
  return clinicRows[0]?.doctor_id || null;
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

// Public booking for patient-facing pages
const bookAppointmentPublic = async (req, res) => {
  const { slot_id, patient_id, clinic_id } = req.body;

  if (!slot_id || !patient_id || !clinic_id) {
    return res.status(400).json({ message: 'slot_id, patient_id, and clinic_id are required' });
  }

  try {
    const doctorId = await resolveDoctorForClinic(clinic_id);
    if (!doctorId) {
      return res.status(404).json({ message: 'No doctor linked to this clinic' });
    }

    await db.query('CALL book_appointment(?, ?, ?, ?, @appt_id, @msg)',
      [slot_id, patient_id, doctorId, clinic_id]
    );
    const [[result]] = await db.query('SELECT @appt_id as appointment_id, @msg as message');

    if (result.message !== 'SUCCESS') {
      return res.status(400).json({ message: result.message });
    }

    res.status(201).json({
      message: 'Appointment booked',
      appointment_id: result.appointment_id,
      doctor_id: doctorId,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const announceDelay = async (req, res) => {
  const { clinic_id, delay_minutes, message } = req.body || {};
  if (!clinic_id) return res.status(400).json({ message: 'clinic_id is required' });

  const delay = Number(delay_minutes) || 0;
  try {
    await db.query(
      `UPDATE Clinic
       SET is_delayed = 1,
           delay_minutes = ?,
           delay_message = ?,
           delay_announced_at = NOW()
       WHERE clinic_id = ?`,
      [delay, message || `Doctor is running approximately ${delay} minutes late.`, clinic_id]
    );

    if (delay > 0) {
      await db.query(
        `UPDATE Slot
         SET slot_start_time = ADDTIME(slot_start_time, SEC_TO_TIME(? * 60))
         WHERE clinic_id = ? AND slot_date = CURDATE() AND status IN ('OPEN', 'BOOKED')`,
        [delay, clinic_id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const clearDelay = async (req, res) => {
  const { clinic_id } = req.body || {};
  if (!clinic_id) return res.status(400).json({ message: 'clinic_id is required' });

  try {
    await db.query(
      `UPDATE Clinic
       SET is_delayed = 0,
           delay_minutes = 0,
           delay_message = NULL,
           delay_announced_at = NULL
       WHERE clinic_id = ?`,
      [clinic_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getTodayAppointments, getUpcomingAppointments, bookAppointment, bookAppointmentPublic, announceDelay, clearDelay };