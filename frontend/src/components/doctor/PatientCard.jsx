const PatientCard = ({ patient, onNewConsultation, onViewHistory }) => {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700
            }}>
              {patient.name?.[0] || '?'}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{patient.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Age {patient.age} · {patient.phone}
                {patient.email && ` · ${patient.email}`}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onViewHistory && (
            <button className="btn btn-outline btn-sm" onClick={onViewHistory}>
              📋 History
            </button>
          )}
          {onNewConsultation && (
            <button className="btn btn-primary btn-sm" onClick={onNewConsultation}>
              + Consultation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCard;