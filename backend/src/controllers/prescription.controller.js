const db = require('../config/db');

const getMyPrescriptions = async (req, res) => {
  const patientId = req.user?.patient_id;

  if (!patientId) {
    return res.status(401).json({ message: 'Unauthorized patient access' });
  }

  try {
    const [[patient]] = await db.query(
      'SELECT patient_id, name, age, phone FROM Patient WHERE patient_id = ? LIMIT 1',
      [patientId]
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const [consultations] = await db.query(
      `SELECT consultation_id, chief_complaint, diagnosis_note, consultation_date, followup_date
       FROM Consultation
       WHERE patient_id = ?
       ORDER BY consultation_date DESC
       LIMIT 20`,
      [patientId]
    );

    const [prescriptions] = await db.query(
      `SELECT pi.*, pr.generated_at, pr.pdf_path
       FROM PrescriptionItem pi
       JOIN Prescription pr ON pi.prescription_id = pr.prescription_id
       WHERE pr.patient_id = ?
       ORDER BY pr.generated_at DESC`,
      [patientId]
    );

    const [conditions] = await db.query(
      'SELECT * FROM PatientConditions WHERE patient_id = ?',
      [patientId]
    );

    return res.json({ patient, consultations, prescriptions, conditions });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const generatePrescription = async (req, res) => {
  const { consultation_id, patient_id, doctor_id, items } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Prescription (consultation_id, patient_id, doctor_id)
       VALUES (?, ?, ?)`,
      [consultation_id, patient_id, doctor_id]
    );
    const prescription_id = result.insertId;

    for (const item of items) {
      await db.query(
        `INSERT INTO PrescriptionItem 
         (prescription_id, medicine_name, dosage, frequency, duration_days, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [prescription_id, item.medicine_name, item.dosage, item.frequency, item.duration_days, item.notes || null]
      );
    }

    res.status(201).json({ message: 'Prescription saved', prescription_id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getPrescription = async (req, res) => {
  const { prescription_id } = req.params;
  try {
    const [[prescription]] = await db.query(
      `SELECT pr.*, p.name as patient_name, p.age, p.phone,
              d.name as doctor_name
       FROM Prescription pr
       JOIN Patient p ON pr.patient_id = p.patient_id
       JOIN Doctor d ON pr.doctor_id = d.doctor_id
       WHERE pr.prescription_id = ?`,
      [prescription_id]
    );

    const [items] = await db.query(
      'SELECT * FROM PrescriptionItem WHERE prescription_id = ?',
      [prescription_id]
    );

    res.json({ prescription, items });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { generatePrescription, getPrescription, getMyPrescriptions };