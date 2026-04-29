const PrescriptionPreview = ({ prescription, items }) => {
  if (!prescription) return null;

  return (
    <div style={{
      border: '2px solid var(--border)',
      borderRadius: 12,
      padding: 24,
      background: 'white',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
            {prescription.clinic_name || 'Sunrise Family Clinic'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Dr. {prescription.doctor_name}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Prescription #{prescription.prescription_id}</div>
          <div>{new Date(prescription.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Patient */}
      <div style={{ marginBottom: 20, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>PATIENT</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{prescription.patient_name}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Age {prescription.age} · {prescription.phone}</div>
      </div>

      {/* Medicines */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Prescribed Medicines
        </div>
        {items?.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 0', borderBottom: '1px solid var(--border)'
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, flexShrink: 0
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{item.medicine_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {item.dosage} · {item.frequency} · {item.duration_days} days
              </div>
              {item.notes && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                  Note: {item.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
        Issued by Dr. {prescription.doctor_name}
      </div>
    </div>
  );
};

export default PrescriptionPreview;