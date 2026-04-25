const TokenCard = ({ tokenNumber, patientName, priority, status }) => {
  const priorityColors = {
    REGULAR: { bg: '#f0f0f0', text: '#666' },
    PRIORITY: { bg: '#fff4e0', text: '#ff9500' },
    URGENT: { bg: '#fff0f0', text: '#ff3b3b' },
  };

  const colors = priorityColors[priority] || priorityColors.REGULAR;

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 24,
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      border: `2px solid ${colors.text}22`,
      maxWidth: 220
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Token Number
      </div>
      <div style={{
        fontSize: 64,
        fontWeight: 900,
        color: '#0f6fff',
        fontFamily: 'monospace',
        lineHeight: 1,
        marginBottom: 12
      }}>
        W{tokenNumber}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{patientName}</div>
      <div style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 20,
        background: colors.bg,
        color: colors.text,
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase'
      }}>
        {priority}
      </div>
      {status && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#718096' }}>
          Status: {status.replace('_', ' ')}
        </div>
      )}
    </div>
  );
};

export default TokenCard;