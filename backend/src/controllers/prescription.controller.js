const db = require('../config/db');
const { generatePrescriptionPdf, DEFAULT_CLINIC_NAME } = require('../services/pdf.service');

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
  const { consultation_id, items } = req.body;
  try {
    const [[consultation]] = await db.query(
      `SELECT c.consultation_id, c.patient_id, c.doctor_id, c.clinic_id,
              c.chief_complaint, c.diagnosis_note, c.followup_instructions,
              p.name as patient_name, p.age, p.phone,
              d.name as doctor_name, d.specialization,
              cl.clinic_name
       FROM Consultation c
       JOIN Patient p ON c.patient_id = p.patient_id
       JOIN Doctor d ON c.doctor_id = d.doctor_id
       LEFT JOIN Clinic cl ON c.clinic_id = cl.clinic_id
       WHERE c.consultation_id = ?
       LIMIT 1`,
      [consultation_id]
    );

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const [result] = await db.query(
      `INSERT INTO Prescription (consultation_id, patient_id, doctor_id)
       VALUES (?, ?, ?)`,
      [consultation.consultation_id, consultation.patient_id, consultation.doctor_id]
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

    const pdf = await generatePrescriptionPdf({
      prescriptionId: prescription_id,
      clinicName: consultation.clinic_name || DEFAULT_CLINIC_NAME,
      doctorName: consultation.doctor_name,
      speciality: consultation.specialization,
      patientName: consultation.patient_name,
      patientAge: consultation.age,
      patientPhone: consultation.phone,
      chiefComplaint: consultation.chief_complaint,
      diagnosisNote: consultation.diagnosis_note,
      followupInstructions: consultation.followup_instructions,
      items,
    });

    await db.query(
      'UPDATE Prescription SET pdf_path = ? WHERE prescription_id = ?',
      [pdf.fileName, prescription_id]
    );

    res.status(201).json({
      message: 'Prescription saved',
      prescription_id,
      pdf_url: pdf.fileUrl,
      clinic_name: consultation.clinic_name || DEFAULT_CLINIC_NAME,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const getPrescription = async (req, res) => {
  const { prescription_id } = req.params;
  try {
    const [[prescription]] = await db.query(
      `SELECT pr.*, p.name as patient_name, p.age, p.phone,
              d.name as doctor_name, d.specialization,
              cl.clinic_name
       FROM Prescription pr
       JOIN Patient p ON pr.patient_id = p.patient_id
       JOIN Doctor d ON pr.doctor_id = d.doctor_id
       JOIN Consultation c ON pr.consultation_id = c.consultation_id
       LEFT JOIN Clinic cl ON c.clinic_id = cl.clinic_id
       WHERE pr.prescription_id = ?`,
      [prescription_id]
    );

    const [items] = await db.query(
      'SELECT * FROM PrescriptionItem WHERE prescription_id = ?',
      [prescription_id]
    );

    res.json({
      prescription,
      items,
      pdf_url: prescription?.pdf_path ? `/pdfs/${prescription.pdf_path}` : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { generatePrescription, getPrescription, getMyPrescriptions };