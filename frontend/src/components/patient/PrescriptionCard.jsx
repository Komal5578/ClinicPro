const PrescriptionCard = ({ consultation, prescriptions }) => {
  const date = new Date(consultation.consultation_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  // Filter prescriptions for this consultation
  const meds = prescriptions?.filter(p =>
    p.generated_at >= consultation.consultation_date
  ) || [];

  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      padding: 20,
      marginBottom: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      borderLeft: '4px solid #0f6fff',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>{date}</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{consultation.chief_complaint}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px',
          borderRadius: 20, background: '#e8f0ff', color: '#0f6fff',
          textTransform: 'uppercase', letterSpacing: 0.5
        }}>
          {consultation.consultation_type}
        </span>
      </div>

      {/* Diagnosis */}
      {consultation.diagnosis_note && (
        <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 14, lineHeight: 1.6 }}>
          {consultation.diagnosis_note}
        </div>
      )}

      {/* Medicines */}
      {meds.length > 0 && (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
             Medicines
          </div>
          {meds.map((med, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 10px', background: '#f8f9ff', borderRadius: 8, marginBottom: 6
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{med.medicine_name}</div>
                <div style={{ fontSize: 12, color: '#718096' }}>
                  {med.dosage}{med.frequency ? ` · ${med.frequency}` : ''}{med.duration_days ? ` · ${med.duration_days} days` : ''}
                </div>
              </div>
              {med.notes && (
                <div style={{ fontSize: 11, color: '#718096', fontStyle: 'italic', maxWidth: 120, textAlign: 'right' }}>
                  {med.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Follow-up */}
      {consultation.followup_date && (
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: '#e8f0ff', borderRadius: 8,
          fontSize: 13, color: '#0f6fff', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
           Follow-up: {new Date(consultation.followup_date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
          {consultation.followup_instructions && (
            <span style={{ fontWeight: 400, color: '#4a5568' }}>
              · {consultation.followup_instructions}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionCard;