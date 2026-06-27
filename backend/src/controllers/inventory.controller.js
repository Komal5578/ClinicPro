const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const getInventory = async (req, res) => {
  const clinic_id = req.user.clinic_id;
  try {
    const { data, error } = await supabase
      .from('inventory_item')
      .select('*')
      .eq('clinic_id', clinic_id)
      .order('item_name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getLowStock = async (req, res) => {
  const clinic_id = req.user.clinic_id;
  try {
    const { data, error } = await supabase
      .from('inventory_item')
      .select('*')
      .eq('clinic_id', clinic_id)
      .order('quantity');
    if (error) throw error;
    // Filter low stock in JS since Supabase can't compare two columns directly
    const lowStock = (data || []).filter(item => item.quantity <= item.threshold_quantity);
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addInventoryItem = async (req, res) => {
  const clinic_id = req.user.clinic_id;
  const { category_id, item_name, quantity, threshold_quantity, expiry_date, unit } = req.body;
  try {
    const { data, error } = await supabase
      .from('inventory_item')
      .insert([{
        clinic_id, category_id, item_name,
        quantity, threshold_quantity: threshold_quantity || 10,
        expiry_date: expiry_date || null, unit,
      }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ message: 'Item added', item_id: data.item_id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateStock = async (req, res) => {
  const { item_id } = req.params;
  const { quantity } = req.body;
  try {
    const { error } = await supabase
      .from('inventory_item')
      .update({ quantity })
      .eq('item_id', item_id);
    if (error) throw error;
    res.json({ message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getInventory, getLowStock, addInventoryItem, updateStock };