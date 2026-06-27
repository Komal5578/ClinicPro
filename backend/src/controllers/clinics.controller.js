const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const getPublicClinics = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clinic')
      .select(`
        clinic_id, clinic_name, address, sector, latitude, longitude,
        morning_start, morning_end, evening_start, evening_end,
        booked_slot_duration, gst_number,
        doctor_clinic(doctor:doctor_id(name, specialization, nmc_verified))
      `)
      .order('clinic_name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getDoctorClinics = async (req, res) => {
  const { doctorId } = req.params;
  try {
    const { data, error } = await supabase
      .from('doctor_clinic')
      .select(`
        clinic:clinic_id(
          clinic_id, clinic_name, address, sector, latitude, longitude,
          morning_start, morning_end, evening_start, evening_end,
          booked_slot_duration, is_delayed, delay_minutes, delay_message
        )
      `)
      .eq('doctor_id', doctorId);
    if (error) throw error;
    const clinics = (data || []).map(row => row.clinic).filter(Boolean);
    res.json(clinics);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getClinicStatus = async (req, res) => {
  const clinic_id = req.params.clinic_id || req.query.clinic_id;
  if (!clinic_id) return res.status(400).json({ message: 'clinic_id is required' });
  try {
    const { data, error } = await supabase
      .from('clinic')
      .select('is_delayed, delay_minutes, delay_message, delay_announced_at')
      .eq('clinic_id', clinic_id)
      .single();
    if (error) throw error;
    res.json(data || { is_delayed: false, delay_minutes: 0, delay_message: null });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getPublicSlots = async (req, res) => {
  const { clinic_id, date } = req.query;
  if (!clinic_id) return res.status(400).json({ message: 'clinic_id is required' });
  const slotDate = date || new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await supabase
      .from('slot')
      .select('slot_id, clinic_id, slot_date, slot_start_time, slot_type, status, token_number')
      .eq('clinic_id', clinic_id)
      .eq('slot_date', slotDate)
      .order('slot_start_time');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getNearbyClinics = async (req, res) => {
  // Supabase doesn't support haversine directly, return all clinics with coords
  try {
    const { data, error } = await supabase
      .from('clinic')
      .select('clinic_id, clinic_name, address, sector, latitude, longitude')
      .not('latitude', 'is', null);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getRecentClinics = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  try {
    const { data, error } = await supabase
      .from('clinic')
      .select('clinic_id, clinic_name, address, sector, latitude, longitude, morning_start, morning_end')
      .order('clinic_id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getPublicClinics, getDoctorClinics, getClinicStatus, getPublicSlots, getNearbyClinics, getRecentClinics };