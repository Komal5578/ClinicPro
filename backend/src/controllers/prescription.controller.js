const db = require('../config/db');

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

module.exports = { generatePrescription, getPrescription };