const ConsultationCard = ({ consultation }) => {
  const date = new Date(consultation.consultation_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div style={{
      padding: 16,
      borderRadius: 10,
      background: 'var(--bg)',
      borderLeft: '3px solid var(--primary)',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {date} · <span style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{consultation.consultation_type}</span>
        </div>
        {consultation.followup_date && (
          <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
             Follow-up: {new Date(consultation.followup_date).toLocaleDateString('en-IN')}
          </span>
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
        {consultation.chief_complaint}
      </div>
      {consultation.diagnosis_note && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {consultation.diagnosis_note}
        </div>
      )}
      {consultation.followup_instructions && (
        <div style={{
          marginTop: 10, fontSize: 12, padding: '6px 10px',
          background: 'var(--primary-light)', borderRadius: 6,
          color: 'var(--primary)'
        }}>
           {consultation.followup_instructions}
        </div>
      )}
    </div>
  );
};

export default ConsultationCard;