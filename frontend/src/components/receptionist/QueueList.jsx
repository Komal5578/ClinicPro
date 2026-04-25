const priorityColor = { REGULAR: 'badge-gray', PRIORITY: 'badge-warning', URGENT: 'badge-danger' };
const statusColor = { WAITING: 'badge-warning', IN_CONSULTATION: 'badge-primary', DONE: 'badge-success' };

const QueueList = ({ walkIns, onUpdateStatus }) => {
  if (!walkIns || walkIns.length === 0) {
    return (
      <div className="empty-state">
        <p>No walk-ins registered yet today</p>
      </div>
    );
  }

  return (
    <div>
      {walkIns.map(w => (
        <div key={w.walkin_id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 8,
          background: w.status === 'DONE' ? '#fafafa' : 'var(--bg)',
          marginBottom: 8,
          opacity: w.status === 'DONE' ? 0.6 : 1,
          border: `1px solid ${w.priority === 'URGENT' ? '#ffcccc' : 'var(--border)'}`,
        }}>
          <div className="token-badge">W{w.token_number}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{w.patient_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {w.chief_complaint || 'No complaint noted'} · Age {w.age}
            </div>
          </div>
          <span className={`badge ${priorityColor[w.priority]}`}>{w.priority}</span>
          <span className={`badge ${statusColor[w.status]}`}>{w.status?.replace('_', ' ')}</span>
          {w.status !== 'DONE' && onUpdateStatus && (
            <select
              className="form-select"
              style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
              value={w.status}
              onChange={e => onUpdateStatus(w.walkin_id, e.target.value)}
            >
              <option value="WAITING">Waiting</option>
              <option value="IN_CONSULTATION">In Consult</option>
              <option value="DONE">Done</option>
            </select>
          )}
        </div>
      ))}
    </div>
  );
};

export default QueueList;