const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const getTodayAppointments = async (req, res) => {
  const { clinicId } = req.query;
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await supabase
      .from('appointment')
      .select(`
        appointment_id, status, booked_at, patient_id,
          patient:patient_id(name, phone, age),
          slot:slot_id(slot_start_time, slot_date, slot_type, token_number)
      `)
      .eq('clinic_id', clinicId)
      .order('appointment_id', { ascending: true });

    if (error) throw error;

    // Filter today's slots in JS since Supabase can't filter on joined table easily
    const todayData = (data || []).filter(a => a.slot?.slot_date === today);
    res.json(todayData);
  } catch (err) {
    console.error('TODAY APPOINTMENTS ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getUpcomingAppointments = async (req, res) => {
  const { clinicId } = req.query;
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await supabase
      .from('appointment')
      .select(`
         appointment_id, status, booked_at, patient_id,
          patient:patient_id(name, phone, age),
          slot:slot_id(slot_start_time, slot_date, slot_type, token_number)
      `)
      .eq('clinic_id', clinicId)
      .order('appointment_id', { ascending: true });

    if (error) throw error;

                const upcoming = (data || []).filter(a => 
          a.slot?.slot_date > today && a.status === 'SCHEDULED'
        );
    res.json(upcoming);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const bookAppointmentPublic = async (req, res) => {
  const { slot_id, patient_id, clinic_id } = req.body;
  if (!slot_id || !patient_id || !clinic_id)
    return res.status(400).json({ message: 'slot_id, patient_id, and clinic_id are required' });

  try {
    // Find doctor for clinic
    const { data: dcRows } = await supabase
      .from('doctor_clinic')
      .select('doctor_id')
      .eq('clinic_id', clinic_id)
      .limit(1);

    const doctor_id = dcRows?.[0]?.doctor_id;
    if (!doctor_id)
      return res.status(404).json({ message: 'No doctor linked to this clinic' });

    // Check slot is open
    const { data: slot } = await supabase
      .from('slot')
      .select('*')
      .eq('slot_id', slot_id)
      .single();

    if (!slot || slot.status !== 'OPEN')
      return res.status(400).json({ message: 'Slot not available' });

    // Book it
    const { data: appt, error } = await supabase
      .from('appointment')
      .insert({ slot_id, patient_id, doctor_id, clinic_id, status: 'SCHEDULED' })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('slot').update({ status: 'BOOKED' }).eq('slot_id', slot_id);

    res.status(201).json({ message: 'Appointment booked', appointment_id: appt.appointment_id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const announceDelay = async (req, res) => {
  const { clinic_id, delay_minutes, message } = req.body || {};
  if (!clinic_id) return res.status(400).json({ message: 'clinic_id is required' });
  const delay = Number(delay_minutes) || 0;
  try {
    const { error } = await supabase.from('clinic').update({
      is_delayed: true,
      delay_minutes: delay,
      delay_message: message || `Doctor is running approximately ${delay} minutes late.`,
      delay_announced_at: new Date().toISOString(),
    }).eq('clinic_id', clinic_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const clearDelay = async (req, res) => {
  const { clinic_id } = req.body || {};
  if (!clinic_id) return res.status(400).json({ message: 'clinic_id is required' });
  try {
    const { error } = await supabase.from('clinic').update({
      is_delayed: false, delay_minutes: 0,
      delay_message: null, delay_announced_at: null,
    }).eq('clinic_id', clinic_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getTodayAppointments, getUpcomingAppointments, bookAppointmentPublic, announceDelay, clearDelay };