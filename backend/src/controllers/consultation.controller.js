const db = require('../config/db');

// Open patient - get full history
const getPatientHistory = async (req, res) => {
  const { patient_id } = req.params;
  try {
    // Last 3 consultations
    const [consultations] = await db.query(
      `SELECT c.*, p.name as patient_name, p.age, p.phone
       FROM Consultation c
       JOIN Patient p ON c.patient_id = p.patient_id
       WHERE c.patient_id = ?
       ORDER BY c.consultation_date DESC LIMIT 3`,
      [patient_id]
    );

    // Prescription items via consultation
    const [prescriptions] = await db.query(
      `SELECT pi.*, pr.generated_at, pr.pdf_path
       FROM PrescriptionItem pi
       JOIN Prescription pr ON pi.prescription_id = pr.prescription_id
       WHERE pr.patient_id = ?
       ORDER BY pr.generated_at DESC`,
      [patient_id]
    );

    // Patient conditions
    const [conditions] = await db.query(
      'SELECT * FROM PatientConditions WHERE patient_id = ?',
      [patient_id]
    );

    res.json({ consultations, prescriptions, conditions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Save consultation
const saveConsultation = async (req, res) => {
  const {
    patient_id, doctor_id, clinic_id,
    appointment_id, walkin_id,
    chief_complaint, diagnosis_note,
    followup_date, followup_instructions,
    consultation_type
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO Consultation 
       (patient_id, doctor_id, clinic_id, appointment_id, walkin_id,
        chief_complaint, diagnosis_note, followup_date, followup_instructions, consultation_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, doctor_id, clinic_id, appointment_id || null, walkin_id || null,
       chief_complaint, diagnosis_note, followup_date || null, followup_instructions || null,
       consultation_type]
    );

    // If followup date set — insert reminder
    if (followup_date) {
      await db.query(
        `INSERT INTO Reminder (patient_id, consultation_id, reminder_type, scheduled_for)
         VALUES (?, ?, 'FOLLOWUP', DATE_SUB(?, INTERVAL 24 HOUR))`,
        [patient_id, result.insertId, followup_date]
      );
    }

    res.status(201).json({
      message: 'Consultation saved',
      consultation_id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getPatientHistory, saveConsultation };