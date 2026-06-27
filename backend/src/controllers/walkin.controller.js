const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const registerWalkIn = async (req, res) => {
  const { patient_id, doctor_id, clinic_id, priority, chief_complaint } = req.body;
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get token count for today
    const { count } = await supabase
      .from('walk_in')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinic_id)
      .gte('arrived_at', `${today}T00:00:00`)
      .lte('arrived_at', `${today}T23:59:59`);

    const token_number = (count || 0) + 1;

    const { data, error } = await supabase
      .from('walk_in')
      .insert([{
        patient_id,
        doctor_id,
        clinic_id,
        token_number,
        priority: priority || 'REGULAR',
        status: 'WAITING',
        chief_complaint,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Walk-in registered',
      data: { walkin_id: data.walkin_id, token_number }
    });
  } catch (err) {
    console.error('WALKIN REGISTER ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getTodayWalkIns = async (req, res) => {
  const { clinicId, clinic_id } = req.query;
  const id = clinicId || clinic_id;
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('walk_in')
      .select(`
        walkin_id, patient_id, token_number, priority, status, chief_complaint, arrived_at,
        patient:patient_id(name, phone, age)
      `)
      .eq('clinic_id', id)
      .gte('arrived_at', `${today}T00:00:00`)
      .lte('arrived_at', `${today}T23:59:59`)
      .in('status', ['WAITING', 'IN_CONSULTATION'])
      .order('arrived_at', { ascending: true });

    if (error) throw error;

    // Flatten patient fields
    const rows = (data || []).map(w => ({
      ...w,
      patient_name: w.patient?.name,
      phone: w.patient?.phone,
      age: w.patient?.age,
    }));

    res.json({ data: rows });
  } catch (err) {
    console.error('WALKIN FETCH ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateWalkInStatus = async (req, res) => {
  const { walkin_id } = req.params;
  const { status } = req.body;
  try {
    const { error } = await supabase
      .from('walk_in')
      .update({ status })
      .eq('walkin_id', walkin_id);

    if (error) throw error;
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { registerWalkIn, getTodayWalkIns, updateWalkInStatus };