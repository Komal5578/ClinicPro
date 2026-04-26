const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Thrice daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'At bedtime',
  'As needed',
];

const MedicineRow = ({ item, idx, onChange, onRemove, showRemove }) => {
  const update = (field, value) => onChange(idx, field, value);

  return (
    <div className="card" style={{ marginBottom: 14, borderLeft: '3px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
           Medicine #{idx + 1}
        </h4>
        {showRemove && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onRemove(idx)}>
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
            onChange={e => update('medicine_name', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Dosage *</label>
          <input
            className="form-input"
            placeholder="e.g. 1 tablet"
            value={item.dosage}
            onChange={e => update('dosage', e.target.value)}
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
            onChange={e => update('frequency', e.target.value)}
          >
            <option value="">Select frequency</option>
            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
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
            onChange={e => update('duration_days', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Special Instructions</label>
        <input
          className="form-input"
          placeholder="e.g. After food, with warm water"
          value={item.notes}
          onChange={e => update('notes', e.target.value)}
        />
      </div>
    </div>
  );
};

export default MedicineRow;