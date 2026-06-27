const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const searchPatient = async (req, res) => {
  const query = req.query.q || req.query.phone;
    console.log('SEARCH HIT - query:', req.query); 
  if (!query) return res.status(400).json({ message: 'Search query required' });

  try {
    const { data, error } = await supabase
      .from('patient')
      .select('*')
      .eq('phone', query)
      .limit(1);

        console.log('SUPABASE RESULT:', data, 'ERROR:', error);
    if (error) throw error;
    if (!data || data.length === 0)
      return res.status(404).json({ message: 'Patient not found' });

    res.json({ data: data[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const registerPatient = async (req, res) => {
  const { name, age, phone, email } = req.body;
  if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });

  try {
    const { data, error } = await supabase
      .from('patient')
      .insert([{ name, age, phone, email }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Patient registered', data });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { searchPatient, registerPatient };