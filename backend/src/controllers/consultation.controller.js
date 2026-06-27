const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const getDoctorUserId = (req) => Number(req.user?.doctor_id || req.user?.id || 0);

const saveConsultation = async (req, res) => {
  const {
    patient_id, doctor_id, clinic_id,
    appointment_id, walkin_id,
    chief_complaint, diagnosis_note,
    followup_date, followup_instructions,
    consultation_type
  } = req.body;

  try {
    const { data, error } = await supabase
      .from('consultation')
      .insert([{
        patient_id, doctor_id, clinic_id,
        appointment_id: appointment_id || null,
        walkin_id: walkin_id || null,
        chief_complaint, diagnosis_note,
        followup_date: followup_date || null,
        followup_instructions: followup_instructions || null,
        consultation_type,
      }])
      .select()
      .single();

    if (error) throw error;

    // ✅ Mark today's appointment as COMPLETE for this patient+clinic
    const today = new Date().toISOString().split('T')[0];

    // Find the appointment: match by patient + clinic, with a slot on today
    const { data: apptRows } = await supabase
      .from('appointment')
      .select('appointment_id, slot:slot_id(slot_date)')
      .eq('patient_id', patient_id)
      .eq('clinic_id', clinic_id)
      .eq('status', 'SCHEDULED');

    if (apptRows?.length) {
      const todayAppt = apptRows.find(a => a.slot?.slot_date === today);
      if (todayAppt) {
        await supabase
          .from('appointment')
          .update({ status: 'COMPLETE' })
          .eq('appointment_id', todayAppt.appointment_id);
      }
    }

    // ✅ Mark walk-in as DONE if walkin_id provided
    if (walkin_id) {
      await supabase
        .from('walkin')
        .update({ status: 'DONE' })
        .eq('walkin_id', walkin_id);
    }

    // Get clinic name
    const { data: clinic } = await supabase
      .from('clinic')
      .select('clinic_name')
      .eq('clinic_id', clinic_id)
      .single();

    res.status(201).json({
      message: 'Consultation saved',
      consultation_id: data.consultation_id,
      clinic_name: clinic?.clinic_name || 'Clinic',
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
    const { data: consultation, error: cErr } = await supabase
      .from('consultation')
      .select('*, patient:patient_id(name, age, phone), doctor:doctor_id(name, specialization), clinic:clinic_id(clinic_name)')
      .eq('consultation_id', consultation_id)
      .single();

    if (cErr || !consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const { data: existingDraft } = await supabase
      .from('prescription')
      .select('prescription_id')
      .eq('consultation_id', consultation_id)
      .is('pdf_path', null)
      .order('prescription_id', { ascending: false })
      .limit(1)
      .single();

    let prescriptionId = existingDraft?.prescription_id;

    if (!prescriptionId) {
      const { data: newPrescription, error: pErr } = await supabase
        .from('prescription')
        .insert([{
          consultation_id: consultation.consultation_id,
          patient_id: consultation.patient_id,
          doctor_id: consultation.doctor_id,
        }])
        .select()
        .single();

      if (pErr) throw pErr;
      prescriptionId = newPrescription.prescription_id;
    }

    await supabase.from('prescription_item').delete().eq('prescription_id', prescriptionId);

    if (items.length > 0) {
      await supabase.from('prescription_item').insert(
        items.map(item => ({
          prescription_id: prescriptionId,
          medicine_name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency || null,
          duration_days: item.duration_days || null,
          notes: item.notes || null,
        }))
      );
    }

    return res.status(201).json({
      message: 'Draft prescription saved',
      prescription_id: prescriptionId,
      clinic_name: consultation.clinic?.clinic_name || 'Clinic',
      is_draft: true,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getPatientHistory = async (req, res) => {
  const { patient_id } = req.params;
  try {
    const { data: consultations } = await supabase
      .from('consultation')
      .select('*, patient:patient_id(name, age, phone)')
      .eq('patient_id', patient_id)
      .order('consultation_date', { ascending: false })
      .limit(3);

    const { data: prescriptions } = await supabase
      .from('prescription')
      .select('*, prescription_item(*)')
      .eq('patient_id', patient_id)
      .not('pdf_path', 'is', null)
      .order('generated_at', { ascending: false });

    res.json({ consultations: consultations || [], prescriptions: prescriptions || [], conditions: [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getDraftByConsultation = async (req, res) => {
  const { consultation_id } = req.params;
  try {
    const { data: prescription } = await supabase
      .from('prescription')
      .select('*, patient:patient_id(name, age, phone), doctor:doctor_id(name, specialization), consultation:consultation_id(clinic_id)')
      .eq('consultation_id', consultation_id)
      .is('pdf_path', null)
      .order('prescription_id', { ascending: false })
      .limit(1)
      .single();

    if (!prescription) return res.status(404).json({ message: 'Draft not found' });

    const { data: items } = await supabase
      .from('prescription_item')
      .select('*')
      .eq('prescription_id', prescription.prescription_id);

    return res.json({ prescription, items: items || [], is_draft: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateDraftPrescription = async (req, res) => {
  const { prescription_id } = req.params;
  const { items = [] } = req.body;
  try {
    await supabase.from('prescription_item').delete().eq('prescription_id', prescription_id);
    if (items.length > 0) {
      await supabase.from('prescription_item').insert(
        items.map(item => ({
          prescription_id: Number(prescription_id),
          medicine_name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency || null,
          duration_days: item.duration_days || null,
          notes: item.notes || null,
        }))
      );
    }
    return res.json({ message: 'Draft updated', prescription_id, is_draft: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const finalizePrescription = async (req, res) => {
  const { prescription_id } = req.params;
  const { items } = req.body;
  try {
    const { data: prescription } = await supabase
      .from('prescription')
      .select('*')
      .eq('prescription_id', prescription_id)
      .single();

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    if (prescription.pdf_path) return res.status(400).json({ message: 'Already finalized' });

    if (Array.isArray(items)) {
      await supabase.from('prescription_item').delete().eq('prescription_id', prescription_id);
      await supabase.from('prescription_item').insert(
        items.map(item => ({
          prescription_id: Number(prescription_id),
          medicine_name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency || null,
          duration_days: item.duration_days || null,
          notes: item.notes || null,
        }))
      );
    }

    await supabase
      .from('prescription')
      .update({ pdf_path: `finalized_${prescription_id}_${Date.now()}.pdf` })
      .eq('prescription_id', prescription_id);

    return res.json({
      message: 'Prescription finalized',
      prescription_id,
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
    const { parsePrescriptionFromDictation } = require('../services/prescriptionAi.service');
    const items = await parsePrescriptionFromDictation({ dictationText: dictation_text });
    return res.json({ message: 'Prescription parsed', items });
  } catch (err) {
    return res.status(502).json({ message: 'AI parsing failed', error: err.message });
  }
};

const getMyPrescriptions = async (req, res) => {
  const patientId = req.user?.patient_id;
  if (!patientId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const { data } = await supabase
      .from('prescription')
      .select('*, prescription_item(*)')
      .eq('patient_id', patientId)
      .not('pdf_path', 'is', null);
    res.json({ prescriptions: data || [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getPrescription = async (req, res) => {
  const { prescription_id } = req.params;
  try {
    const { data: prescription } = await supabase
      .from('prescription')
      .select('*, prescription_item(*), patient:patient_id(name, age, phone), doctor:doctor_id(name, specialization)')
      .eq('prescription_id', prescription_id)
      .single();

    res.json({
      prescription,
      items: prescription?.prescription_item || [],
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
  getPatientHistory,
  getDraftByConsultation,
  getMyPrescriptions,
  getPrescription,
  saveConsultation,
  updateDraftPrescription,
};