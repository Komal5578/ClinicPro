const priorityColors = {
  REGULAR: 'badge-gray',
  PRIORITY: 'badge-warning',
  URGENT: 'badge-danger'
};

const statusColors = {
  WAITING: 'badge-warning',
  IN_CONSULTATION: 'badge-primary',
  DONE: 'badge-success'
};

const QueueItem = ({ patient, onStart, onView }) => {
  const isDone = patient.status === 'DONE';
  const isInConsult = patient.status === 'IN_CONSULTATION';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      borderRadius: 10,
      background: isDone ? '#fafafa' : 'white',
      border: `1px solid ${patient.priority === 'URGENT' ? '#ffcccc' : 'var(--border)'}`,
      borderLeft: `4px solid ${
        patient.priority === 'URGENT' ? 'var(--danger)' :
        patient.priority === 'PRIORITY' ? 'var(--warning)' :
        'var(--border)'
      }`,
      marginBottom: 10,
      opacity: isDone ? 0.6 : 1,
      transition: 'all 0.15s',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Token */}
      <div className="token-badge">W{patient.token_number}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{patient.patient_name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Age {patient.age} · {patient.phone}
          {patient.chief_complaint && (
            <span style={{ marginLeft: 6, color: 'var(--text)' }}>· "{patient.chief_complaint}"</span>
          )}
        </div>
      </div>

      {/* Badges */}
      <span className={`badge ${priorityColors[patient.priority] || 'badge-gray'}`}>
        {patient.priority}
      </span>
      <span className={`badge ${statusColors[patient.status] || 'badge-gray'}`}>
        {patient.status?.replace('_', ' ')}
      </span>

      {/* Action button */}
      {!isDone && (
        <button
          className={`btn ${isInConsult ? 'btn-primary' : 'btn-success'} btn-sm`}
          onClick={() => isInConsult ? onView(patient) : onStart(patient)}
        >
          {isInConsult ? 'Continue' : '▶ Start'}
        </button>
      )}
      {isDone && (
        <button className="btn btn-outline btn-sm" onClick={() => onView(patient)}>
          History
        </button>
      )}
    </div>
  );
};

export default QueueItem;