const db = require('../config/db');

const getInventory = async (req, res) => {
  const { clinic_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM Inventory WHERE clinic_id = ? ORDER BY medicine_name ASC`,
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
      `SELECT * FROM Inventory 
       WHERE clinic_id = ? AND quantity_strips <= reorder_level
       ORDER BY quantity_strips ASC`,
      [clinic_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addInventoryItem = async (req, res) => {
  const { clinic_id, medicine_name, batch_number, expiry_date,
          quantity_strips, strips_per_box, reorder_level, purchase_price, sale_price } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Inventory 
       (clinic_id, medicine_name, batch_number, expiry_date,
        quantity_strips, strips_per_box, reorder_level, purchase_price, sale_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clinic_id, medicine_name, batch_number, expiry_date,
       quantity_strips, strips_per_box, reorder_level || 10, purchase_price, sale_price]
    );
    res.status(201).json({ message: 'Item added', inventory_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateStock = async (req, res) => {
  const { inventory_id } = req.params;
  const { quantity_strips } = req.body;
  try {
    await db.query(
      'UPDATE Inventory SET quantity_strips = ? WHERE inventory_id = ?',
      [quantity_strips, inventory_id]
    );
    res.json({ message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getInventory, getLowStock, addInventoryItem, updateStock };