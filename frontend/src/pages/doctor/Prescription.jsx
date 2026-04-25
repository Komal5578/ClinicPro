import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { generatePrescription } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const emptyMedicine = () => ({
  medicine_name: '', dosage: '', frequency: '', duration_days: '', notes: ''
});

const Prescription = () => {
  const { consultation_id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient_id] = useState(localStorage.getItem('current_patient_id') || '');
  const [items, setItems] = useState([emptyMedicine()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const addMedicine = () => setItems(i => [...i, emptyMedicine()]);
  const removeMedicine = (idx) => setItems(i => i.filter((_, j) => j !== idx));

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, j) =>
      j === idx ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some(i => !i.medicine_name || !i.dosage)) {
      setError('Please fill medicine name and dosage for all items');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await generatePrescription({
        consultation_id,
        patient_id: patient_id || 1,
        doctor_id: user.id,
        items,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  const frequencies = ['Once daily', 'Twice daily', 'Thrice daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'At bedtime', 'As needed'];

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <div className="page-header" style={{ margin: 0 }}>
            <h2>💊 Write Prescription</h2>
            <p>Consultation #{consultation_id}</p>
          </div>
        </div>

        {success ? (
          <div className="card" style={{ maxWidth: 600, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>Prescription Saved!</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, marginBottom: 24 }}>
              The prescription has been saved and inventory alerts triggered if any medicine is low.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => navigate('/doctor/queue')}>
                Back to Queue
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
            {error && <div className="alert alert-danger">{error}</div>}

            {items.map((item, idx) => (
              <div key={idx} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700 }}>Medicine #{idx + 1}</h4>
                  {items.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeMedicine(idx)}>
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Medicine Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Paracetamol 500mg"
                      value={item.medicine_name}
                      onChange={e => updateItem(idx, 'medicine_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dosage *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 1 tablet"
                      value={item.dosage}
                      onChange={e => updateItem(idx, 'dosage', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <select
                      className="form-select"
                      value={item.frequency}
                      onChange={e => updateItem(idx, 'frequency', e.target.value)}
                    >
                      <option value="">Select frequency</option>
                      {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (days)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5"
                      min="1"
                      value={item.duration_days}
                      onChange={e => updateItem(idx, 'duration_days', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Special Instructions</label>
                  <input
                    className="form-input"
                    placeholder="e.g. After food, with warm water"
                    value={item.notes}
                    onChange={e => updateItem(idx, 'notes', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-outline" onClick={addMedicine} style={{ marginBottom: 20 }}>
              + Add Another Medicine
            </button>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Saving...' : '✓ Save Prescription'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Prescription;