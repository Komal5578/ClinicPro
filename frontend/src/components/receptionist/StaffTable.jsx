const StaffTable = ({ staff }) => {
  if (!staff || staff.length === 0) {
    return <div className="empty-state"><p>No staff added yet</p></div>;
  }

  return (
    <div>
      {staff.map(s => (
        <div key={s.staff_id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          borderRadius: 10,
          background: 'var(--bg)',
          marginBottom: 10,
          border: '1px solid var(--border)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: s.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--success-light)',
            color: s.role === 'ADMIN' ? 'var(--primary)' : 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, flexShrink: 0
          }}>
            {s.name?.[0]?.toUpperCase() || '?'}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.phone}</div>
          </div>

          {/* Role badge */}
          <span className={`badge ${s.role === 'ADMIN' ? 'badge-primary' : 'badge-success'}`}>
            {s.role}
          </span>

          {/* Date */}
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : ''}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StaffTable;