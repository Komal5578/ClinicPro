const TIME_ICONS = { morning: '🌅', afternoon: '☀️', night: '🌙' };

const ReminderCard = ({ time, medicines }) => {
  if (!medicines || medicines.length === 0) return null;

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: 18,
      marginBottom: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, textTransform: 'capitalize' }}>
        {TIME_ICONS[time]} {time}
      </div>
      {medicines.map((med, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
          borderBottom: i < medicines.length - 1 ? '1px solid #f0f0f0' : 'none'
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{med.medicine_name}</div>
            <div style={{ fontSize: 12, color: '#718096' }}>{med.notes || 'As directed'}</div>
          </div>
          <div style={{
            fontWeight: 700,
            color: '#0f6fff',
            background: '#e8f0ff',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 13
          }}>
            {med.dosage}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReminderCard;