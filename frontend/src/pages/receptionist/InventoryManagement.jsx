import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import InventoryTable from '../../components/receptionist/InventoryTable';
import { getInventory, getLowStock, addInventoryItem, updateStock } from '../../services/api';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({
    category_id: 1, item_name: '', quantity: '',
    threshold_quantity: 10, unit: 'units', expiry_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [inv, ls] = await Promise.all([getInventory(), getLowStock()]);
      setInventory(inv.data);
      setLowStock(ls.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await addInventoryItem(form);
      setSuccess('Item added successfully!');
      setForm({ category_id: 1, item_name: '', quantity: '', threshold_quantity: 10, unit: 'units', expiry_date: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item');
    } finally { setLoading(false); }
  };

  const handleUpdateStock = async (item_id, qty) => {
    try {
      await updateStock(item_id, qty);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const displayItems = tab === 'low' ? lowStock : inventory;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2> Inventory Management</h2>
          <p>Track medicines, consumables and equipment</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Items</div>
            <div className="stat-value">{inventory.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Low Stock</div>
            <div className="stat-value" style={{ color: lowStock.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {lowStock.length}
            </div>
            <div className="stat-sub">Need reordering</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Add form */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>+ Add New Item</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value={1}>Medicine</option>
                  <option value={2}>Consumable</option>
                  <option value={3}>Equipment</option>
                  <option value={4}>Lab Supply</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input className="form-input" placeholder="e.g. Paracetamol 500mg" value={form.item_name}
                  onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input type="number" className="form-input" placeholder="100" value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Alert below</label>
                  <input type="number" className="form-input" value={form.threshold_quantity}
                    onChange={e => setForm(f => ({ ...f, threshold_quantity: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    <option value="strip">Strip</option>
                    <option value="units">Units</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input type="date" className="form-input" value={form.expiry_date}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Adding...' : '+ Add Item'}
              </button>
            </form>
          </div>

          {/* Inventory list */}
          <div className="card">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTab('all')}>All ({inventory.length})</button>
              <button className={`btn btn-sm ${tab === 'low' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setTab('low')}>
                 Low Stock ({lowStock.length})
              </button>
            </div>
            <InventoryTable items={displayItems} onUpdateStock={handleUpdateStock} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;