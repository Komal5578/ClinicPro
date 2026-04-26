import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { getAllStaff, addStaff, getInventory, getLowStock, addInventoryItem, updateStock } from '../../services/api';

const StaffManager = () => {
  const [tab, setTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'RECEPTIONIST' });
  const [invForm, setInvForm] = useState({ category_id: 1, item_name: '', quantity: '', threshold_quantity: 10, unit: 'units' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = async () => {
    try {
      const [s, inv, ls] = await Promise.all([getAllStaff(), getInventory(), getLowStock()]);
      setStaff(s.data);
      setInventory(inv.data);
      setLowStock(ls.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await addStaff(staffForm);
      setSuccess('Staff member added!');
      setStaffForm({ name: '', phone: '', role: 'RECEPTIONIST' });
      fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to add staff'); }
    finally { setLoading(false); }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await addInventoryItem(invForm);
      setSuccess('Item added to inventory!');
      setInvForm({ category_id: 1, item_name: '', quantity: '', threshold_quantity: 10, unit: 'units' });
      fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to add item'); }
    finally { setLoading(false); }
  };

  const handleUpdateStock = async (item_id, newQty) => {
    try {
      await updateStock(item_id, newQty);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2> Staff & Inventory</h2>
          <p>Manage clinic staff and inventory</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['staff', 'inventory'].map(t => (
            <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setTab(t); setError(''); setSuccess(''); }}>
              {t === 'staff' ? ' Staff' : ` Inventory ${lowStock.length > 0 ? `(${lowStock.length} low)` : ''}`}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {tab === 'staff' && (
          <div className="grid-2">
            {/* Add Staff */}
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Add Staff Member</h3>
              <form onSubmit={handleAddStaff}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Staff name" value={staffForm.name}
                    onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" placeholder="Phone number" value={staffForm.phone}
                    onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={staffForm.role}
                    onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Adding...' : '+ Add Staff'}
                </button>
              </form>
            </div>

            {/* Staff List */}
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Current Staff ({staff.length})</h3>
              {staff.length === 0 ? <div className="empty-state"><p>No staff added yet</p></div> :
                staff.map(s => (
                  <div key={s.staff_id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, background: 'var(--bg)', marginBottom: 8
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {s.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.phone}</div>
                    </div>
                    <span className="badge badge-primary">{s.role}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <div className="grid-2">
            {/* Add Item */}
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Add Inventory Item</h3>
              <form onSubmit={handleAddInventory}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={invForm.category_id}
                    onChange={e => setInvForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value={1}>Medicine</option>
                    <option value={2}>Consumable</option>
                    <option value={3}>Equipment</option>
                    <option value={4}>Lab Supply</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input className="form-input" placeholder="e.g. Paracetamol 500mg" value={invForm.item_name}
                    onChange={e => setInvForm(f => ({ ...f, item_name: e.target.value }))} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input type="number" className="form-input" placeholder="100" value={invForm.quantity}
                      onChange={e => setInvForm(f => ({ ...f, quantity: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alert threshold</label>
                    <input type="number" className="form-input" value={invForm.threshold_quantity}
                      onChange={e => setInvForm(f => ({ ...f, threshold_quantity: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={invForm.unit}
                    onChange={e => setInvForm(f => ({ ...f, unit: e.target.value }))}>
                    <option value="strip">Strip</option>
                    <option value="units">Units</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Adding...' : '+ Add Item'}
                </button>
              </form>
            </div>

            {/* Inventory List */}
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Inventory ({inventory.length} items)</h3>
              {inventory.length === 0 ? <div className="empty-state"><p>No items in inventory</p></div> :
                inventory.map(item => {
                  const isLow = item.quantity <= item.threshold_quantity;
                  return (
                    <div key={item.item_id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8,
                      background: isLow ? 'var(--danger-light)' : 'var(--bg)',
                      marginBottom: 8, border: isLow ? '1px solid #ffcccc' : 'none'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{item.item_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Threshold: {item.threshold_quantity} {item.unit}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--success)', fontSize: 16 }}>
                          {item.quantity}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.unit}</span>
                        {isLow && <span className="badge badge-danger">LOW</span>}
                      </div>
                      <button className="btn btn-outline btn-sm" onClick={() => {
                        const qty = prompt(`Update quantity for ${item.item_name} (current: ${item.quantity})`);
                        if (qty && !isNaN(qty)) handleUpdateStock(item.item_id, parseInt(qty));
                      }}>Update</button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;