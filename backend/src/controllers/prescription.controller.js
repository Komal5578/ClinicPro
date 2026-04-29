const db = require('../config/db');
const { generatePrescriptionPdf, DEFAULT_CLINIC_NAME } = require('../services/pdf.service');
const { parsePrescriptionFromDictation } = require('../services/prescriptionAi.service');

const getDoctorUserId = (req) => Number(req.user?.doctor_id || req.user?.id || 0);

const getConsultationDetails = async (consultationId) => {
  const [[consultation]] = await db.query(
    `SELECT c.consultation_id, c.patient_id, c.doctor_id, c.clinic_id,
            c.appointment_id, c.walkin_id,
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
    [consultationId]
  );

  return consultation;
};

const replacePrescriptionItems = async (prescriptionId, items = []) => {
  await db.query('DELETE FROM PrescriptionItem WHERE prescription_id = ?', [prescriptionId]);

  for (const item of items) {
    await db.query(
      `INSERT INTO PrescriptionItem
       (prescription_id, medicine_name, dosage, frequency, duration_days, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        prescriptionId,
        item.medicine_name,
        item.dosage,
        item.frequency || null,
        item.duration_days || null,
        item.notes || null,
      ]
    );
  }
};

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
      `SELECT pi.*, pr.consultation_id, pr.generated_at, pr.pdf_path
       FROM PrescriptionItem pi
       JOIN Prescription pr ON pi.prescription_id = pr.prescription_id
       WHERE pr.patient_id = ?
       AND pr.pdf_path IS NOT NULL
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
    const consultation = await getConsultationDetails(consultation_id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const [result] = await db.query(
      `INSERT INTO Prescription (consultation_id, patient_id, doctor_id)
       VALUES (?, ?, ?)`,
      [consultation.consultation_id, consultation.patient_id, consultation.doctor_id]
    );
    const prescription_id = result.insertId;

    await replacePrescriptionItems(prescription_id, items);

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

const createDraftPrescription = async (req, res) => {
  const { consultation_id, items = [] } = req.body;
  const doctorUserId = getDoctorUserId(req);

  if (!consultation_id) {
    return res.status(400).json({ message: 'consultation_id is required' });
  }

  try {
    const consultation = await getConsultationDetails(consultation_id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    if (Number(consultation.doctor_id) !== doctorUserId) {
      return res.status(403).json({ message: 'Not allowed for this consultation' });
    }

    const [[existingDraft]] = await db.query(
      `SELECT prescription_id
       FROM Prescription
       WHERE consultation_id = ? AND doctor_id = ? AND pdf_path IS NULL
       ORDER BY prescription_id DESC
       LIMIT 1`,
      [consultation_id, consultation.doctor_id]
    );

    let prescriptionId = existingDraft?.prescription_id;

    if (!prescriptionId) {
      const [insertResult] = await db.query(
        `INSERT INTO Prescription (consultation_id, patient_id, doctor_id)
         VALUES (?, ?, ?)`,
        [consultation.consultation_id, consultation.patient_id, consultation.doctor_id]
      );
      prescriptionId = insertResult.insertId;
    }

    await replacePrescriptionItems(prescriptionId, items);

    return res.status(201).json({
      message: 'Draft prescription saved',
      prescription_id: prescriptionId,
      clinic_name: consultation.clinic_name || DEFAULT_CLINIC_NAME,
      is_draft: true,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getDraftByConsultation = async (req, res) => {
  const { consultation_id } = req.params;
  const doctorUserId = getDoctorUserId(req);

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
       WHERE pr.consultation_id = ? AND pr.pdf_path IS NULL
       ORDER BY pr.prescription_id DESC
       LIMIT 1`,
      [consultation_id]
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    if (Number(prescription.doctor_id) !== doctorUserId) {
      return res.status(403).json({ message: 'Not allowed for this draft' });
    }

    const [items] = await db.query(
      'SELECT * FROM PrescriptionItem WHERE prescription_id = ?',
      [prescription.prescription_id]
    );

    return res.json({ prescription, items, is_draft: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateDraftPrescription = async (req, res) => {
  const { prescription_id } = req.params;
  const { items = [] } = req.body;
  const doctorUserId = getDoctorUserId(req);

  try {
    const [[prescription]] = await db.query(
      `SELECT *
       FROM Prescription
       WHERE prescription_id = ? AND pdf_path IS NULL
       LIMIT 1`,
      [prescription_id]
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Draft prescription not found' });
    }

    if (Number(prescription.doctor_id) !== doctorUserId) {
      return res.status(403).json({ message: 'Not allowed for this draft' });
    }

    await replacePrescriptionItems(prescription.prescription_id, items);

    return res.json({
      message: 'Draft updated',
      prescription_id: prescription.prescription_id,
      is_draft: true,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const finalizePrescription = async (req, res) => {
  const { prescription_id } = req.params;
  const { items } = req.body;
  const doctorUserId = getDoctorUserId(req);

  try {
    const [[prescription]] = await db.query(
      `SELECT *
       FROM Prescription
       WHERE prescription_id = ?
       LIMIT 1`,
      [prescription_id]
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (Number(prescription.doctor_id) !== doctorUserId) {
      return res.status(403).json({ message: 'Not allowed for this prescription' });
    }

    if (prescription.pdf_path) {
      return res.status(400).json({ message: 'Prescription already finalized' });
    }

    if (Array.isArray(items)) {
      await replacePrescriptionItems(prescription.prescription_id, items);
    }

    const consultation = await getConsultationDetails(prescription.consultation_id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found for this prescription' });
    }

    const [draftItems] = await db.query(
      'SELECT * FROM PrescriptionItem WHERE prescription_id = ?',
      [prescription.prescription_id]
    );

    if (!draftItems.length) {
      return res.status(400).json({ message: 'Add at least one medicine before finalizing' });
    }

    const pdf = await generatePrescriptionPdf({
      prescriptionId: prescription.prescription_id,
      clinicName: consultation.clinic_name || DEFAULT_CLINIC_NAME,
      doctorName: consultation.doctor_name,
      speciality: consultation.specialization,
      patientName: consultation.patient_name,
      patientAge: consultation.age,
      patientPhone: consultation.phone,
      chiefComplaint: consultation.chief_complaint,
      diagnosisNote: consultation.diagnosis_note,
      followupInstructions: consultation.followup_instructions,
      items: draftItems,
    });

    await db.query(
      'UPDATE Prescription SET pdf_path = ? WHERE prescription_id = ?',
      [pdf.fileName, prescription.prescription_id]
    );

    if (consultation.appointment_id) {
      await db.query(
        `UPDATE Appointment
         SET status = 'COMPLETE'
         WHERE appointment_id = ?`,
        [consultation.appointment_id]
      );
    }

    if (consultation.walkin_id) {
      await db.query(
        `UPDATE WalkIn
         SET status = 'DONE'
         WHERE walkin_id = ?`,
        [consultation.walkin_id]
      );
    }

    return res.json({
      message: 'Prescription finalized',
      prescription_id: prescription.prescription_id,
      pdf_url: pdf.fileUrl,
      clinic_name: consultation.clinic_name || DEFAULT_CLINIC_NAME,
      is_draft: false,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const aiAutofillPrescription = async (req, res) => {
  const { dictation_text } = req.body || {};

  if (!String(dictation_text || '').trim()) {
    return res.status(400).json({ message: 'dictation_text is required' });
  }

  try {
    const items = await parsePrescriptionFromDictation({ dictationText: dictation_text });
    return res.json({
      message: 'Prescription parsed from dictation',
      items,
    });
  } catch (err) {
    return res.status(502).json({ message: 'AI prescription parsing failed', error: err.message });
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

module.exports = {
  aiAutofillPrescription,
  createDraftPrescription,
  finalizePrescription,
  generatePrescription,
  getDraftByConsultation,
  getMyPrescriptions,
  getPrescription,
  updateDraftPrescription,
};