const db = require('../config/db');

const getInventory = async (req, res) => {
  const { clinic_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM InventoryItem WHERE clinic_id = ? ORDER BY item_name ASC`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getLowStock = async (req, res) => {
  const { clinic_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM InventoryItem 
       WHERE clinic_id = ? AND quantity <= threshold_quantity
       ORDER BY quantity ASC`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addInventoryItem = async (req, res) => {
  const { clinic_id, category_id, item_name, quantity,
          threshold_quantity, expiry_date, unit } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO InventoryItem 
       (clinic_id, category_id, item_name, quantity, threshold_quantity, expiry_date, unit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clinic_id, category_id, item_name, quantity,
       threshold_quantity || 10, expiry_date || null, unit]
    );
    res.status(201).json({ message: 'Item added', item_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateStock = async (req, res) => {
  const { item_id } = req.params;
  const { quantity } = req.body;
  try {
    await db.query(
      'UPDATE InventoryItem SET quantity = ? WHERE item_id = ?',
      [quantity, item_id]
    );
    res.json({ message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getInventory, getLowStock, addInventoryItem, updateStock };