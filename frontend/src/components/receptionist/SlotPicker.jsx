const SlotPicker = ({ slots, selectedSlot, onSelect }) => {
  const openSlots = slots.filter(s => s.status === 'OPEN');

  if (openSlots.length === 0) {
    return (
      <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>
        No open slots available today
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {openSlots.map(slot => {
        const isSelected = selectedSlot === slot.slot_id;
        const tokenLabel = slot.token_number ? `T${slot.token_number}` : null;

        return (
          <button
            key={slot.slot_id}
            type="button"
            onClick={() => onSelect(slot.slot_id)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
              background: isSelected ? 'var(--primary-light)' : 'white',
              color: isSelected ? 'var(--primary)' : 'var(--text)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'monospace',
              transition: 'all 0.15s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              minWidth: 80,
            }}
          >
            {tokenLabel && (
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1,
                color: isSelected ? 'var(--primary)' : '#888',
              }}>
                {tokenLabel}
              </span>
            )}
            {slot.slot_start_time?.slice(0, 5)}
          </button>
        );
      })}
    </div>
  );
};

export default SlotPicker;